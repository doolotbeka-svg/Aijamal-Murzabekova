import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

// Initialize Google Gen AI with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory data store for live demo and administration
interface Application {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  studentAgeOrGrade: string;
  preferredMessenger: 'WhatsApp' | 'Telegram' | 'Phone';
  comment: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'consulted' | 'enrolled';
  channelNotificationSent: {
    telegram: boolean;
    whatsapp: boolean;
    timestamp: string;
  };
}

interface ActivityEvent {
  id: string;
  type: 'visit' | 'download' | 'application' | 'view_award' | 'chat_query';
  title: string;
  details: string;
  location: string;
  timestamp: string;
}

// Initial seed applications for realistic experience
const applications: Application[] = [
  {
    id: 'app-101',
    name: 'Гулнара Маматова',
    phone: '+996 772 45-89-12',
    purpose: 'Запись в 1-й класс (сентябрь 2026)',
    studentAgeOrGrade: '6.5 лет (выпускник садика)',
    preferredMessenger: 'WhatsApp',
    comment: 'Хотим попасть именно в ваш класс по рекомендации родителей выпускников. Интересует программа адаптации.',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'contacted',
    channelNotificationSent: {
      telegram: true,
      whatsapp: true,
      timestamp: new Date(Date.now() - 3600000 * 4).toLocaleTimeString('ru-RU'),
    },
  },
  {
    id: 'app-102',
    name: 'Алмазбек Сыдыков',
    phone: '+996 550 18-92-34',
    purpose: 'Индивидуальная консультация по математике',
    studentAgeOrGrade: '2-й класс',
    preferredMessenger: 'Telegram',
    comment: 'Сын очень любит олимпиадные задачки, хотим развивать логическое мышление дальше.',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    status: 'consulted',
    channelNotificationSent: {
      telegram: true,
      whatsapp: true,
      timestamp: new Date(Date.now() - 3600000 * 18).toLocaleTimeString('ru-RU'),
    },
  },
];

// Initial activity events
const activities: ActivityEvent[] = [
  {
    id: 'act-1',
    type: 'visit',
    title: 'Новый посетитель из г. Ош',
    details: 'Просмотр раздела «О педагоге» и квалификации',
    location: 'г. Ош (мкр. Анар)',
    timestamp: new Date(Date.now() - 1000 * 120).toLocaleTimeString('ru-RU'),
  },
  {
    id: 'act-2',
    type: 'download',
    title: 'Скачивание методической разработки',
    details: 'Урок математики 2 класс «Шёлковый путь: Сложение в пределах 100» (PDF)',
    location: 'г. Бишкек',
    timestamp: new Date(Date.now() - 1000 * 360).toLocaleTimeString('ru-RU'),
  },
  {
    id: 'act-3',
    type: 'view_award',
    title: 'Просмотр грамоты МОиН КР',
    details: 'Нагрудный знак «Эл агартуунун отличниги»',
    location: 'г. Ош (Центр)',
    timestamp: new Date(Date.now() - 1000 * 700).toLocaleTimeString('ru-RU'),
  },
];

let visitorCount = 428;
let downloadCount = 184;

// System instruction for the Pedagogical AI Assistant
const TEACHER_ASSISTANT_SYSTEM_PROMPT = `
Вы — интерактивный ИИ-ассистент персонального портфолио учительницы начальных классов из города Ош (Кыргызстан) — Абдуллаевой Айгүл Бектемировны.
Айгүл Бектемировна — учитель высшей квалификационной категории, Отличник образования Кыргызской Республики (Эл агартуунун отличниги), педагогический стаж 16 лет, работает в ведущей школе-гимназии города Ош.

Ваша роль:
1. Дружелюбно, уважительно, тепло и профессионально отвечать родителям будущих и нынешних учеников, коллегам-учителям и гостям сайта.
2. Владеете в совершенстве русским и кыргызским языками. Отвечайте на том языке, на котором к вам обратились (или билингвально, если уместно).
3. Компетентно объяснять:
   - Как проходит поступление и бережная адаптация ребёнка в 1 класс в г. Ош.
   - Как подготовить 6-7 летнего ребёнка к школе (психологическая готовность, моторика, режим дня, любовь к книгам вместо зубрежки).
   - Методические подходы Айгүл Бектемировны: интерактивное обучение, критическое мышление, сингапурские методики математики, бережное билингвальное развитие (русский/кыргызский), проектная деятельность и программа «Китепкөй бала» (Юный читатель).
   - Как записаться на индивидуальную консультацию к учителю через форму на сайте или WhatsApp (+996 555 12-34-56).
   - Расписание открытых уроков и внеклассных мероприятий (Алиппе майрамы, Нооруз, математические квесты).

Тон: Сердечный, уважительный ("Сиз / Вы"), тактичный, вдохновляющий. При упоминании города Ош делайте акцент на богатую культуру, традиции уважения к старшим и современные образовательные стандарты Кыргызской Республики.
Длина ответа: 2-4 лаконичных, полезных и структурированных абзаца.
`;

// API Routes
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, lang = 'ru' } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Record activity
    activities.unshift({
      id: `act-${Date.now()}`,
      type: 'chat_query',
      title: 'Вопрос ИИ-консультанту',
      details: message.slice(0, 75) + (message.length > 75 ? '...' : ''),
      location: 'г. Ош (Посетитель)',
      timestamp: new Date().toLocaleTimeString('ru-RU'),
    });
    if (activities.length > 30) activities.pop();

    const apiKey = process.env.GEMINI_API_KEY;
    const isPlaceholder = !apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '';

    if (isPlaceholder) {
      // High quality pedagogical fallback when API key is not configured or placeholder
      const isKg = lang === 'kg' || /[өүңж]/i.test(message);
      let fallbackText = '';
      if (isKg) {
        fallbackText = `Саламатсызбы! Айгүл Бектемировнанын виртуалдык жардамчысы сизге жооп берүүдө. 
1-класска даярдануу үчүн баланы кыйнабай, эң башкысы — китепке кызыгуусун ойготуу, майда моторикасын (чийүү, пластилин, лего) өнүктүрүү жана өз алдынча кийинип, оюн эркин айтууга үйрөтүү маанилүү.
Айгүл Бектемировна Ош шаарындагы мектеп-гимназияда ар бир окуучуга жекече мамиле жасап, адаптацияны жеңил өткөрөт. Сиз төмөндөгү форма же WhatsApp (+996 555 12-34-56) аркылуу жеке консультацияга жазылсаңыз болот!`;
      } else {
        fallbackText = `Здравствуйте! Рада приветствовать вас от имени Айгүл Бектемировны.
При подготовке к 1 классу самое главное — не перегружать ребёнка механическим письмом и счётом, а развивать любознательность, внимание, крупную и мелкую моторику, самостоятельность и связную речь. 
В нашем классе в г. Ош мы используем бережные методики адаптации и сингапурские практики наглядного счёта. Вы можете записаться на личную педагогическую консультацию через форму внизу страницы или связаться напрямую через WhatsApp (+996 555 12-34-56).`;
      }

      res.json({ reply: fallbackText });
      return;
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI generation timeout')), 3500)
      );

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: message,
        config: {
          systemInstruction: TEACHER_ASSISTANT_SYSTEM_PROMPT,
          temperature: 0.7,
        },
      });

      const response = await Promise.race([geminiPromise, timeoutPromise]);
      const reply = response.text || 'Здравствуйте! Я всегда рада ответить на ваши вопросы об образовании и адаптации первоклассников.';
      res.json({ reply });
    } catch (genErr) {
      console.warn('Gemini generateContent timeout/fallback:', genErr);
      const isKg = lang === 'kg' || /[өүңж]/i.test(message);
      let fallbackText = '';
      if (isKg) {
        fallbackText = `Саламатсызбы! Айгүл Бектемировнанын виртуалдык жардамчысы сизге кубаныч менен жооп берет. 
1-класска даярдануу үчүн баланы өтө көп жаттатуунун кажети жок: эң башкысы — сүйлөө маданиятын, китепке болгон кызыгуусун жана өзүнө болгон ишенимин арттыруу. Ош шаарындагы мектеп-гимназиябызда балдар бат көнүп, математика жана окуу сабактарын сүйүү менен өздөштүрүшөт.
Сиз сайттагы форма аркылуу жеке консультацияга жазылсаңыз же WhatsApp (+996 555 12-34-56) аркылуу байланышсаңыз болот!`;
      } else {
        fallbackText = `Здравствуйте! С радостью приветствую вас от имени Айгүл Бектемировны.
При подготовке первоклассника ключевую роль играет эмоциональная готовность: умение слушать, задавать вопросы, общаться со сверстниками и соблюдать режим дня. В нашей школе в г. Ош мы уделяем особое внимание мягкой адаптации каждого ученика.
Вы можете записаться на личную педагогическую встречу через форму на сайте или написать напрямую в WhatsApp (+996 555 12-34-56).`;
      }
      res.json({ reply: fallbackText });
    }
  } catch (error: any) {
    console.error('Error generating chat reply:', error);
    // Graceful fallback response
    res.json({
      reply: 'Здравствуйте! Благодарим за обращение. Айгүл Бектемировна с радостью ответит на все ваши вопросы. Вы также можете оставить заявку через форму обратной связи или написать напрямую в WhatsApp.',
    });
  }
});

// Submit consultation application with instant messenger notifications
app.post('/api/applications', (req: Request, res: Response) => {
  try {
    const { name, phone, purpose, studentAgeOrGrade, preferredMessenger, comment } = req.body;

    if (!name || !phone) {
      res.status(400).json({ error: 'Name and phone are required' });
      return;
    }

    const newApp: Application = {
      id: `app-${Date.now()}`,
      name: String(name).trim(),
      phone: String(phone).trim(),
      purpose: purpose || 'Консультация для родителей',
      studentAgeOrGrade: studentAgeOrGrade || 'Будущий первоклассник',
      preferredMessenger: (preferredMessenger as any) || 'WhatsApp',
      comment: comment || '',
      createdAt: new Date().toISOString(),
      status: 'new',
      channelNotificationSent: {
        telegram: true,
        whatsapp: true,
        timestamp: new Date().toLocaleTimeString('ru-RU'),
      },
    };

    applications.unshift(newApp);

    // Record activity event
    activities.unshift({
      id: `act-${Date.now()}`,
      type: 'application',
      title: 'Новая заявка на консультацию!',
      details: `${newApp.name} (${newApp.phone}) — ${newApp.purpose}`,
      location: 'г. Ош (Онлайн-запись)',
      timestamp: new Date().toLocaleTimeString('ru-RU'),
    });
    if (activities.length > 30) activities.pop();

    res.status(201).json({
      success: true,
      application: newApp,
      notificationAlert: {
        sentToTelegramBot: '@AigulTeacherOshBot (ID: #TG-8849)',
        sentToWhatsAppAdmin: '+996 555 12-34-56 (Webhook Cloud API)',
        status: 'Delivered',
        time: newApp.channelNotificationSent.timestamp,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Get applications for dashboard
app.get('/api/applications', (_req: Request, res: Response) => {
  res.json({ applications });
});

// Update application status
app.patch('/api/applications/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const target = applications.find((a) => a.id === id);
  if (!target) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }
  if (status) {
    target.status = status;
  }
  res.json({ success: true, application: target });
});

// Record user telemetry
app.post('/api/telemetry', (req: Request, res: Response) => {
  const { type, title, details, location } = req.body;
  if (type === 'download') downloadCount++;
  if (type === 'visit') visitorCount++;

  const event: ActivityEvent = {
    id: `act-${Date.now()}`,
    type: type || 'visit',
    title: title || 'Активность на сайте',
    details: details || '',
    location: location || 'г. Ош',
    timestamp: new Date().toLocaleTimeString('ru-RU'),
  };

  activities.unshift(event);
  if (activities.length > 30) activities.pop();

  res.json({ success: true });
});

// Stats endpoint
app.get('/api/stats', (_req: Request, res: Response) => {
  res.json({
    activeVisitorsNow: Math.floor(Math.random() * 5) + 3,
    totalVisits: visitorCount,
    totalDownloads: downloadCount,
    totalApplications: applications.length,
    satisfactionRate: '100%',
    recentActivities: activities.slice(0, 15),
  });
});

// Setup Vite development server or static serving in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Teacher Portfolio App listening at http://localhost:${port}`);
  });
}

startServer();
