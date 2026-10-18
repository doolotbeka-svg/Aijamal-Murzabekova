import express, { NextFunction, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import { mergeContent, type SiteContent } from '../data/content.js';
import {
  readJson,
  writeJson,
  saveImage,
  readImage,
  isAllowedImageType,
  storageMode,
  StorageNotConfiguredError,
} from './storage.js';
import type {
  ActivityEvent,
  AdminStats,
  ApplicationRecord,
  ApplicationStatus,
  Review,
  ReviewStatus,
} from '../types';

// ---------------------------------------------------------------------------
// Storage: one JSON document (local file in dev, private Vercel Blob in production).
// Serverless instances do not share memory, so every request reads the latest copy.
// ---------------------------------------------------------------------------

interface Database {
  applications: ApplicationRecord[];
  reviews: Review[];
  activities: ActivityEvent[];
  counters: { visits: number; downloads: number; chatQueries: number };
  dailyVisits: Record<string, number>;
}

const DB_PATH = 'db.json';
const CONTENT_PATH = 'content.json';
const MAX_CONTENT_BYTES = 900 * 1024;
const MAX_ACTIVITIES = 200;

function emptyDb(): Database {
  return {
    applications: [],
    reviews: [],
    activities: [],
    counters: { visits: 0, downloads: 0, chatQueries: 0 },
    dailyVisits: {},
  };
}

async function loadDb(): Promise<Database> {
  const raw = await readJson<Partial<Database>>(DB_PATH);
  if (!raw) return emptyDb();
  return { ...emptyDb(), ...raw, counters: { ...emptyDb().counters, ...raw.counters } };
}

async function saveDb(db: Database) {
  await writeJson(DB_PATH, db);
}

/** Site texts, contacts and photos as edited in the admin panel (defaults until the first save). */
async function loadContent(): Promise<SiteContent> {
  return mergeContent(await readJson(CONTENT_PATH));
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function logActivity(db: Database, type: ActivityEvent['type'], title: string, details: string) {
  db.activities.unshift({ id: newId('act'), type, title, details, createdAt: new Date().toISOString() });
  if (db.activities.length > MAX_ACTIVITIES) db.activities.length = MAX_ACTIVITIES;
}

/** Trim a user-supplied value to a bounded string. */
function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/** Wraps async handlers so storage errors become a JSON 500 instead of a hanging request. */
function handle(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response) => {
    fn(req, res).catch((err) => {
      console.error(`${req.method} ${req.originalUrl} failed:`, err);
      if (res.headersSent) return;
      if (err instanceof StorageNotConfiguredError) {
        res.status(503).json({ error: err.message });
        return;
      }
      // The admin is authenticated, so show the real cause to make problems fixable
      const isAdmin = req.originalUrl.startsWith('/api/admin');
      res.status(500).json({
        error: isAdmin ? `Ошибка сервера: ${err?.message || err}` : 'Ошибка сервера. Попробуйте позже.',
      });
    });
  };
}

// ---------------------------------------------------------------------------
// Rate limiting (in memory, per IP and per server instance)
// ---------------------------------------------------------------------------

const hits = new Map<string, number[]>();

function rateLimit(bucket: string, limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${bucket}:${req.ip}`;
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      res.status(429).json({ error: 'Слишком много запросов. Попробуйте немного позже.' });
      return;
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear();
    next();
  };
}

// ---------------------------------------------------------------------------
// Admin authentication: signed, expiring tokens (no server-side session state)
// ---------------------------------------------------------------------------

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
// Changing ADMIN_PASSWORD invalidates all issued tokens
const sessionKey = crypto.createHash('sha256').update(`admin-session:${ADMIN_PASSWORD}`).digest();

function sign(payload: string) {
  return crypto.createHmac('sha256', sessionKey).update(payload).digest('hex');
}

function issueToken() {
  const expires = String(Date.now() + SESSION_TTL_MS);
  return `${expires}.${sign(expires)}`;
}

function tokenValid(token: string) {
  const [expires, signature, extra] = token.split('.');
  if (extra !== undefined || !/^\d+$/.test(expires || '') || !/^[0-9a-f]{64}$/.test(signature || '')) return false;
  if (Number(expires) < Date.now()) return false;
  const expected = Buffer.from(sign(expires), 'hex');
  const given = Buffer.from(signature, 'hex');
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

function passwordMatches(candidate: string) {
  const a = crypto.createHash('sha256').update(candidate).digest();
  const b = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();
  return crypto.timingSafeEqual(a, b);
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!ADMIN_PASSWORD || !tokenValid(token)) {
    res.status(401).json({ error: 'Требуется вход в админ-панель' });
    return;
  }
  next();
}

// ---------------------------------------------------------------------------
// Telegram notifications for new applications / reviews
// ---------------------------------------------------------------------------

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const telegramEnabled = Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID);

async function sendTelegram(text: string): Promise<'sent' | 'failed' | 'disabled'> {
  if (!telegramEnabled) return 'disabled';
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error('Telegram API error:', res.status, await res.text());
      return 'failed';
    }
    return 'sent';
  } catch (err) {
    console.error('Telegram request failed:', err);
    return 'failed';
  }
}

// ---------------------------------------------------------------------------
// Pedagogical AI assistant (Gemini)
// ---------------------------------------------------------------------------

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const geminiEnabled = Boolean(GEMINI_API_KEY.trim() && GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

const ai = geminiEnabled
  ? new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    })
  : null;

function buildSystemPrompt({ teacherProfile, schoolContactDetails }: SiteContent) {
  const teacherName = teacherProfile.fullName.ru;
  const teacherShort = teacherProfile.shortName.ru;
  return `
Вы — интерактивный ИИ-ассистент персонального сайта-портфолио учительницы начальных классов из города Ош (Кыргызстан) — ${teacherName} (к ней обращаются «${teacherShort}»).
${teacherShort} — ${teacherProfile.title.ru.toLowerCase()}, педагогический стаж ${teacherProfile.experienceYears} лет, место работы: ${teacherProfile.school.ru}.

Ваша роль:
1. Дружелюбно, уважительно, тепло и профессионально отвечать родителям будущих и нынешних учеников, коллегам-учителям и гостям сайта.
2. Вы владеете русским и кыргызским языками. Отвечайте на том языке, на котором к вам обратились.
3. Компетентно объяснять:
   - Как проходит поступление и бережная адаптация ребёнка в 1 класс в г. Ош.
   - Как подготовить ребёнка 6–7 лет к школе (психологическая готовность, моторика, режим дня, любовь к книгам вместо зубрёжки).
   - Методические подходы учителя: интерактивное обучение, критическое мышление, сингапурские методики математики, билингвальное развитие (русский/кыргызский), проектная деятельность, программа «Китепкөй бала».
   - Как записаться на консультацию: через форму «Контакты» на сайте, по телефону/WhatsApp ${schoolContactDetails.phoneDisplay} или в Telegram ${schoolContactDetails.telegramUser}.
4. Не выдумывайте конкретные даты, цены, расписание или обещания от имени учителя. Если не знаете — предложите оставить заявку через форму на сайте.

Тон: сердечный, уважительный («Сиз / Вы»), тактичный. Длина ответа: 2–4 коротких абзаца, без markdown-разметки.
`;
}

function fallbackReply(isKg: boolean, { teacherProfile, schoolContactDetails }: SiteContent) {
  const teacherShort = teacherProfile.shortName[isKg ? 'kg' : 'ru'];
  return isKg
    ? `Саламатсызбы! ${teacherShort} сизге кубаныч менен жардам берет.\n1-класска даярдануу үчүн баланы кыйнабай, эң башкысы — китепке кызыгуусун ойготуу, майда моторикасын өнүктүрүү жана өз алдынча болууга үйрөтүү маанилүү.\nСайттагы «Байланыш» формасы же WhatsApp (${schoolContactDetails.phoneDisplay}) аркылуу жеке консультацияга жазылсаңыз болот.`
    : `Здравствуйте! ${teacherShort} будет рада помочь.\nПри подготовке к 1 классу главное — не перегружать ребёнка механическим письмом и счётом, а развивать любознательность, внимание, моторику, самостоятельность и связную речь.\nЗаписаться на личную консультацию можно через форму «Контакты» внизу страницы или по WhatsApp ${schoolContactDetails.phoneDisplay}.`;
}

const MESSENGERS = ['WhatsApp', 'Telegram', 'Phone'] as const;
const APPLICATION_STATUSES: ApplicationStatus[] = ['new', 'contacted', 'consulted', 'enrolled', 'archived'];
const REVIEW_STATUSES: ReviewStatus[] = ['pending', 'approved', 'rejected'];

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export function createApiApp() {
  const app = express();
  // Vercel / Cloud Run put the real client IP into X-Forwarded-For
  app.set('trust proxy', true);
  // Site content is edited as one JSON document, everything else is small
  const smallJson = express.json({ limit: '32kb' });
  const contentJson = express.json({ limit: '1mb' });
  app.use('/api', (req, res, next) => (req.path === '/admin/content' ? contentJson : smallJson)(req, res, next));

  app.get(
    '/api/content',
    handle(async (_req, res) => {
      // Short CDN cache: edits show up within half a minute without a storage read per visitor
      res.set('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=300');
      res.json(await loadContent());
    })
  );

  app.get(
    '/api/images/:name',
    handle(async (req, res) => {
      const image = await readImage(String(req.params.name));
      if (!image) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      // Image names are unique per upload, so they can be cached forever
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      res.set('X-Content-Type-Options', 'nosniff');
      res.type(image.contentType).send(image.data);
    })
  );

  app.post('/api/admin/login', rateLimit('login', 5, 15 * 60 * 1000), (req: Request, res: Response) => {
    if (!ADMIN_PASSWORD) {
      res.status(503).json({
        error: 'Пароль администратора не настроен. Задайте переменную окружения ADMIN_PASSWORD на сервере.',
      });
      return;
    }
    const password = clean(req.body?.password, 200);
    if (!password || !passwordMatches(password)) {
      res.status(401).json({ error: 'Неверный пароль' });
      return;
    }
    res.json({ token: issueToken(), expiresInMs: SESSION_TTL_MS });
  });

  // Tokens are stateless; the client simply forgets its token
  app.post('/api/admin/logout', (_req: Request, res: Response) => {
    res.json({ success: true });
  });

  app.post(
    '/api/chat',
    rateLimit('chat', 20, 10 * 60 * 1000),
    handle(async (req, res) => {
      const message = clean(req.body?.message, 1000);
      const lang = req.body?.lang === 'kg' ? 'kg' : 'ru';
      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      // Previous turns of this conversation, so follow-up questions make sense
      const rawHistory: unknown[] = Array.isArray(req.body?.history) ? req.body.history.slice(-10) : [];
      const history = rawHistory
        .map((h: any) => ({
          role: h?.sender === 'user' ? 'user' : 'model',
          parts: [{ text: clean(h?.text, 2000) }],
        }))
        .filter((h) => h.parts[0].text);

      const db = await loadDb();
      db.counters.chatQueries++;
      logActivity(db, 'chat_query', 'Вопрос ИИ-консультанту', message.slice(0, 120) + (message.length > 120 ? '…' : ''));
      await saveDb(db);

      const isKg = lang === 'kg' || /[өүң]/i.test(message);
      const content = await loadContent();
      if (!ai) {
        res.json({ reply: fallbackReply(isKg, content), fallback: true });
        return;
      }

      try {
        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: [...history, { role: 'user', parts: [{ text: message }] }],
          config: {
            systemInstruction: buildSystemPrompt(content),
            temperature: 0.7,
            abortSignal: AbortSignal.timeout(20000),
          },
        });
        res.json({ reply: response.text?.trim() || fallbackReply(isKg, content) });
      } catch (err) {
        console.warn('Gemini error, using fallback reply:', err);
        res.json({ reply: fallbackReply(isKg, content), fallback: true });
      }
    })
  );

  app.post(
    '/api/applications',
    rateLimit('apply', 5, 10 * 60 * 1000),
    handle(async (req, res) => {
      const name = clean(req.body?.name, 100);
      const phone = clean(req.body?.phone, 30);
      if (name.length < 2 || phone.replace(/\D/g, '').length < 9) {
        res.status(400).json({ error: 'Укажите имя и корректный номер телефона' });
        return;
      }
      const messenger = MESSENGERS.includes(req.body?.preferredMessenger) ? req.body.preferredMessenger : 'WhatsApp';

      const record: ApplicationRecord = {
        id: newId('app'),
        name,
        phone,
        purpose: clean(req.body?.purpose, 150) || 'Консультация для родителей',
        studentAgeOrGrade: clean(req.body?.studentAgeOrGrade, 80),
        preferredMessenger: messenger,
        comment: clean(req.body?.comment, 1500),
        createdAt: new Date().toISOString(),
        status: 'new',
        adminNote: '',
        notification: { telegram: 'disabled', at: '' },
      };

      record.notification = {
        telegram: await sendTelegram(
          [
            '📝 Новая заявка с сайта',
            `Имя: ${record.name}`,
            `Телефон: ${record.phone}`,
            `Цель: ${record.purpose}`,
            record.studentAgeOrGrade && `Ребёнок: ${record.studentAgeOrGrade}`,
            `Удобная связь: ${record.preferredMessenger}`,
            record.comment && `Комментарий: ${record.comment}`,
          ]
            .filter(Boolean)
            .join('\n')
        ),
        at: new Date().toISOString(),
      };

      const db = await loadDb();
      db.applications.unshift(record);
      logActivity(db, 'application', 'Новая заявка на консультацию', `${record.name} — ${record.purpose}`);
      await saveDb(db);
      res.status(201).json({ success: true, application: { id: record.id, name: record.name } });
    })
  );

  app.get(
    '/api/reviews',
    handle(async (_req, res) => {
      const db = await loadDb();
      res.json({ reviews: db.reviews.filter((r) => r.status === 'approved') });
    })
  );

  app.post(
    '/api/reviews',
    rateLimit('review', 3, 60 * 60 * 1000),
    handle(async (req, res) => {
      const author = clean(req.body?.author, 80);
      const text = clean(req.body?.text, 1500);
      const rating = Math.min(5, Math.max(1, Math.round(Number(req.body?.rating) || 5)));
      if (author.length < 2 || text.length < 10) {
        res.status(400).json({ error: 'Укажите имя и текст отзыва (не короче 10 символов)' });
        return;
      }
      const review: Review = {
        id: newId('rev'),
        author,
        role: clean(req.body?.role, 120),
        rating,
        text,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      const db = await loadDb();
      db.reviews.unshift(review);
      logActivity(db, 'review', 'Новый отзыв ожидает модерации', `${author}: ${text.slice(0, 80)}`);
      await saveDb(db);
      await sendTelegram(`⭐ Новый отзыв (${rating}/5) ожидает модерации в админ-панели\n${author}: ${text}`);
      res.status(201).json({ success: true });
    })
  );

  app.post(
    '/api/telemetry',
    rateLimit('telemetry', 60, 10 * 60 * 1000),
    handle(async (req, res) => {
      const type = req.body?.type;
      if (type !== 'visit' && type !== 'download') {
        res.status(400).json({ error: 'Unknown event type' });
        return;
      }
      const db = await loadDb();
      if (type === 'visit') {
        db.counters.visits++;
        db.dailyVisits[today()] = (db.dailyVisits[today()] || 0) + 1;
      } else {
        db.counters.downloads++;
        logActivity(db, 'download', 'Скачан методический материал', clean(req.body?.details, 200));
      }
      await saveDb(db);
      res.json({ success: true });
    })
  );

  // -------------------------------------------------------------------------
  // Admin endpoints (hidden panel at /#admin)
  // -------------------------------------------------------------------------

  const admin = express.Router();
  admin.use(requireAdmin);

  admin.get(
    '/stats',
    handle(async (_req, res) => {
      const db = await loadDb();
      const last7Days: AdminStats['last7Days'] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        last7Days.push({ date: d, visits: db.dailyVisits[d] || 0 });
      }
      const stats: AdminStats = {
        totalVisits: db.counters.visits,
        visitsToday: db.dailyVisits[today()] || 0,
        totalDownloads: db.counters.downloads,
        totalChatQueries: db.counters.chatQueries,
        totalApplications: db.applications.length,
        newApplications: db.applications.filter((a) => a.status === 'new').length,
        pendingReviews: db.reviews.filter((r) => r.status === 'pending').length,
        last7Days,
        recentActivities: db.activities.slice(0, 50),
        integrations: { telegram: telegramEnabled, gemini: geminiEnabled, geminiModel: GEMINI_MODEL, storage: storageMode },
      };
      res.json(stats);
    })
  );

  admin.get(
    '/applications',
    handle(async (_req, res) => {
      const db = await loadDb();
      res.json({ applications: db.applications });
    })
  );

  admin.patch(
    '/applications/:id',
    handle(async (req, res) => {
      const db = await loadDb();
      const target = db.applications.find((a) => a.id === req.params.id);
      if (!target) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }
      if (req.body?.status !== undefined) {
        if (!APPLICATION_STATUSES.includes(req.body.status)) {
          res.status(400).json({ error: 'Invalid status' });
          return;
        }
        target.status = req.body.status;
      }
      if (req.body?.adminNote !== undefined) target.adminNote = clean(req.body.adminNote, 1000);
      await saveDb(db);
      res.json({ success: true, application: target });
    })
  );

  admin.delete(
    '/applications/:id',
    handle(async (req, res) => {
      const db = await loadDb();
      const before = db.applications.length;
      db.applications = db.applications.filter((a) => a.id !== req.params.id);
      if (db.applications.length === before) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }
      await saveDb(db);
      res.json({ success: true });
    })
  );

  admin.get(
    '/reviews',
    handle(async (_req, res) => {
      const db = await loadDb();
      res.json({ reviews: db.reviews });
    })
  );

  admin.patch(
    '/reviews/:id',
    handle(async (req, res) => {
      const db = await loadDb();
      const target = db.reviews.find((r) => r.id === req.params.id);
      if (!target) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }
      if (!REVIEW_STATUSES.includes(req.body?.status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }
      target.status = req.body.status;
      await saveDb(db);
      res.json({ success: true, review: target });
    })
  );

  admin.delete(
    '/reviews/:id',
    handle(async (req, res) => {
      const db = await loadDb();
      const before = db.reviews.length;
      db.reviews = db.reviews.filter((r) => r.id !== req.params.id);
      if (db.reviews.length === before) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }
      await saveDb(db);
      res.json({ success: true });
    })
  );

  // Uncached read for the editor, so it always starts from the latest saved version
  admin.get(
    '/content',
    handle(async (_req, res) => {
      res.set('Cache-Control', 'no-store');
      res.json(await loadContent());
    })
  );

  admin.put(
    '/content',
    handle(async (req, res) => {
      if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
        res.status(400).json({ error: 'Invalid content' });
        return;
      }
      const content = mergeContent(req.body);
      if (Buffer.byteLength(JSON.stringify(content)) > MAX_CONTENT_BYTES) {
        res.status(413).json({ error: 'Слишком много текста — сократите содержимое' });
        return;
      }
      await writeJson(CONTENT_PATH, content);
      res.json({ success: true, content });
    })
  );

  admin.post(
    '/upload',
    express.raw({ type: () => true, limit: '4mb' }),
    handle(async (req, res) => {
      const contentType = String(req.headers['content-type'] || '').split(';')[0].trim();
      if (!isAllowedImageType(contentType) || !Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).json({ error: 'Загрузите изображение JPG, PNG, WebP или GIF' });
        return;
      }
      const name = await saveImage(req.body, contentType);
      res.status(201).json({ url: `/api/images/${name}` });
    })
  );

  // Russian ↔ Kyrgyz translation for the content editor
  admin.post(
    '/translate',
    rateLimit('translate', 300, 10 * 60 * 1000),
    handle(async (req, res) => {
      const text = clean(req.body?.text, 4000);
      const [source, target] = req.body?.from === 'kg' ? ['кыргызского', 'русский'] : ['русского', 'кыргызский'];
      if (!text) {
        res.json({ text: '' });
        return;
      }
      if (!ai) {
        res.status(503).json({ error: 'Автоперевод недоступен: на сервере не задан GEMINI_API_KEY' });
        return;
      }
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text }] }],
        config: {
          systemInstruction:
            `Переведи текст пользователя с ${source} на ${target} язык для сайта учительницы начальных классов из г. Ош. ` +
            'Верни только перевод, без пояснений и кавычек вокруг ответа. Сохрани имена, числа, даты, телефоны, ссылки, ' +
            `эмодзи, кавычки внутри текста и переносы строк. Если текст уже на языке перевода (${target}), верни его без изменений.`,
          temperature: 0.2,
          abortSignal: AbortSignal.timeout(20000),
        },
      });
      const translated = response.text?.trim();
      if (!translated) throw new Error('Пустой ответ переводчика');
      res.json({ text: translated });
    })
  );

  admin.post(
    '/telegram-test',
    handle(async (_req, res) => {
      const result = await sendTelegram('✅ Тестовое сообщение из админ-панели сайта-портфолио');
      res.json({ result });
    })
  );

  app.use('/api/admin', admin);

  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Body parser errors (too large, broken JSON) as readable JSON instead of an HTML page
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    console.error(`${req.method} ${req.originalUrl} failed:`, err);
    if (err?.type === 'entity.too.large') {
      res.status(413).json({ error: 'Слишком большой файл или текст (максимум 4 МБ)' });
      return;
    }
    if (err?.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'Некорректные данные запроса' });
      return;
    }
    res.status(500).json({ error: 'Ошибка сервера. Попробуйте позже.' });
  });

  return app;
}

export const adminPasswordConfigured = Boolean(ADMIN_PASSWORD);
