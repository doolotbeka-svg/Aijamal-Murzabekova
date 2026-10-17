import express, { NextFunction, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { teacherProfile, schoolContactDetails } from './src/data/content';
import type {
  ActivityEvent,
  AdminStats,
  ApplicationRecord,
  ApplicationStatus,
  Review,
  ReviewStatus,
} from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Cloud Run / reverse proxies put the real client IP into X-Forwarded-For
app.set('trust proxy', true);
app.use(express.json({ limit: '32kb' }));

// ---------------------------------------------------------------------------
// Persistent storage (JSON file, survives restarts)
// ---------------------------------------------------------------------------

interface Database {
  applications: ApplicationRecord[];
  reviews: Review[];
  activities: ActivityEvent[];
  counters: { visits: number; downloads: number; chatQueries: number };
  dailyVisits: Record<string, number>;
}

const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
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

function loadDb(): Database {
  try {
    const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    return { ...emptyDb(), ...raw, counters: { ...emptyDb().counters, ...raw.counters } };
  } catch (err: any) {
    if (err.code !== 'ENOENT') console.error('Не удалось прочитать базу данных, начинаю с пустой:', err);
    return emptyDb();
  }
}

const db = loadDb();
let saveTimer: NodeJS.Timeout | null = null;

function persist() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
      fs.renameSync(tmp, DB_FILE);
    } catch (err) {
      console.error('Не удалось сохранить базу данных:', err);
    }
  }, 300);
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function logActivity(type: ActivityEvent['type'], title: string, details: string) {
  db.activities.unshift({ id: newId('act'), type, title, details, createdAt: new Date().toISOString() });
  if (db.activities.length > MAX_ACTIVITIES) db.activities.length = MAX_ACTIVITIES;
  persist();
}

/** Trim a user-supplied value to a bounded string. */
function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

// ---------------------------------------------------------------------------
// Rate limiting (in memory, per IP)
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
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, times] of hits) {
    if (times.every((t) => now - t > 60 * 60 * 1000)) hits.delete(key);
  }
}, 10 * 60 * 1000).unref();

// ---------------------------------------------------------------------------
// Admin authentication
// ---------------------------------------------------------------------------

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const sessions = new Map<string, number>();

function passwordMatches(candidate: string) {
  const a = crypto.createHash('sha256').update(candidate).digest();
  const b = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();
  return crypto.timingSafeEqual(a, b);
}

function bearerToken(req: Request) {
  return (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = bearerToken(req);
  const expires = token ? sessions.get(token) : undefined;
  if (!expires || expires < Date.now()) {
    if (token) sessions.delete(token);
    res.status(401).json({ error: 'Требуется вход в админ-панель' });
    return;
  }
  next();
}

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
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  res.json({ token, expiresInMs: SESSION_TTL_MS });
});

app.post('/api/admin/logout', (req: Request, res: Response) => {
  sessions.delete(bearerToken(req));
  res.json({ success: true });
});

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

const teacherName = teacherProfile.fullName.ru;
const teacherShort = teacherProfile.shortName.ru;

const TEACHER_ASSISTANT_SYSTEM_PROMPT = `
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

function fallbackReply(isKg: boolean) {
  return isKg
    ? `Саламатсызбы! ${teacherShort} сизге кубаныч менен жардам берет.\n1-класска даярдануу үчүн баланы кыйнабай, эң башкысы — китепке кызыгуусун ойготуу, майда моторикасын өнүктүрүү жана өз алдынча болууга үйрөтүү маанилүү.\nСайттагы «Байланыш» формасы же WhatsApp (${schoolContactDetails.phoneDisplay}) аркылуу жеке консультацияга жазылсаңыз болот.`
    : `Здравствуйте! ${teacherShort} будет рада помочь.\nПри подготовке к 1 классу главное — не перегружать ребёнка механическим письмом и счётом, а развивать любознательность, внимание, моторику, самостоятельность и связную речь.\nЗаписаться на личную консультацию можно через форму «Контакты» внизу страницы или по WhatsApp ${schoolContactDetails.phoneDisplay}.`;
}

app.post('/api/chat', rateLimit('chat', 20, 10 * 60 * 1000), async (req: Request, res: Response) => {
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

  db.counters.chatQueries++;
  logActivity('chat_query', 'Вопрос ИИ-консультанту', message.slice(0, 120) + (message.length > 120 ? '…' : ''));

  const isKg = lang === 'kg' || /[өүң]/i.test(message);
  if (!ai) {
    res.json({ reply: fallbackReply(isKg), fallback: true });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: TEACHER_ASSISTANT_SYSTEM_PROMPT,
        temperature: 0.7,
        abortSignal: AbortSignal.timeout(20000),
      },
    });
    res.json({ reply: response.text?.trim() || fallbackReply(isKg) });
  } catch (err) {
    console.warn('Gemini error, using fallback reply:', err);
    res.json({ reply: fallbackReply(isKg), fallback: true });
  }
});

// ---------------------------------------------------------------------------
// Public endpoints
// ---------------------------------------------------------------------------

const MESSENGERS = ['WhatsApp', 'Telegram', 'Phone'] as const;
const APPLICATION_STATUSES: ApplicationStatus[] = ['new', 'contacted', 'consulted', 'enrolled', 'archived'];
const REVIEW_STATUSES: ReviewStatus[] = ['pending', 'approved', 'rejected'];

app.post('/api/applications', rateLimit('apply', 5, 10 * 60 * 1000), async (req: Request, res: Response) => {
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

  db.applications.unshift(record);
  logActivity('application', 'Новая заявка на консультацию', `${record.name} — ${record.purpose}`);
  res.status(201).json({ success: true, application: { id: record.id, name: record.name } });
});

app.get('/api/reviews', (_req: Request, res: Response) => {
  res.json({ reviews: db.reviews.filter((r) => r.status === 'approved') });
});

app.post('/api/reviews', rateLimit('review', 3, 60 * 60 * 1000), async (req: Request, res: Response) => {
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
  db.reviews.unshift(review);
  logActivity('review', 'Новый отзыв ожидает модерации', `${author}: ${text.slice(0, 80)}`);
  await sendTelegram(`⭐ Новый отзыв (${rating}/5) ожидает модерации в админ-панели\n${author}: ${text}`);
  res.status(201).json({ success: true });
});

app.post('/api/telemetry', rateLimit('telemetry', 60, 10 * 60 * 1000), (req: Request, res: Response) => {
  const type = req.body?.type;
  if (type === 'visit') {
    db.counters.visits++;
    db.dailyVisits[today()] = (db.dailyVisits[today()] || 0) + 1;
    persist();
  } else if (type === 'download') {
    db.counters.downloads++;
    logActivity('download', 'Скачан методический материал', clean(req.body?.details, 200));
  } else {
    res.status(400).json({ error: 'Unknown event type' });
    return;
  }
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// Admin endpoints (hidden panel at /#admin)
// ---------------------------------------------------------------------------

const admin = express.Router();
admin.use(requireAdmin);

admin.get('/stats', (_req: Request, res: Response) => {
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
    integrations: { telegram: telegramEnabled, gemini: geminiEnabled, geminiModel: GEMINI_MODEL },
  };
  res.json(stats);
});

admin.get('/applications', (_req: Request, res: Response) => {
  res.json({ applications: db.applications });
});

admin.patch('/applications/:id', (req: Request, res: Response) => {
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
  persist();
  res.json({ success: true, application: target });
});

admin.delete('/applications/:id', (req: Request, res: Response) => {
  const before = db.applications.length;
  db.applications = db.applications.filter((a) => a.id !== req.params.id);
  if (db.applications.length === before) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }
  persist();
  res.json({ success: true });
});

admin.get('/reviews', (_req: Request, res: Response) => {
  res.json({ reviews: db.reviews });
});

admin.patch('/reviews/:id', (req: Request, res: Response) => {
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
  persist();
  res.json({ success: true, review: target });
});

admin.delete('/reviews/:id', (req: Request, res: Response) => {
  const before = db.reviews.length;
  db.reviews = db.reviews.filter((r) => r.id !== req.params.id);
  if (db.reviews.length === before) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }
  persist();
  res.json({ success: true });
});

admin.post('/telegram-test', async (_req: Request, res: Response) => {
  const result = await sendTelegram('✅ Тестовое сообщение из админ-панели сайта-портфолио');
  res.json({ result });
});

app.use('/api/admin', admin);

app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// ---------------------------------------------------------------------------
// Frontend: Vite dev server in development, static build in production
// ---------------------------------------------------------------------------

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const dist = path.resolve(__dirname, 'dist');
    app.use(express.static(dist, { index: false, maxAge: '7d' }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  if (!ADMIN_PASSWORD) {
    console.warn('⚠️  ADMIN_PASSWORD не задан — вход в админ-панель (/#admin) будет недоступен.');
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Teacher Portfolio App listening at http://localhost:${port} (admin: /#admin)`);
  });
}

startServer();
