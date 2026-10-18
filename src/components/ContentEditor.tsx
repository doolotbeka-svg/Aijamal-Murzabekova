import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../types';
import { defaultContent, mergeContent, type SiteContent } from '../data/content';
import { useContentState } from '../ContentContext';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  ImagePlus,
  Loader2,
  Languages,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';

interface ContentEditorProps {
  lang: Language;
  token: string;
  onUnauthorized: () => void;
  /** Reports unsaved changes so the panel can warn before closing. */
  onDirtyChange: (dirty: boolean) => void;
}

type Section = keyof SiteContent;

// A tab of the editor can show several parts of the content, each in its own block
const SECTIONS: { id: string; ru: string; kg: string; keys: Section[] }[] = [
  { id: 'profile', ru: 'Фото и профиль', kg: 'Сүрөт жана профиль', keys: ['teacherProfile'] },
  { id: 'gallery', ru: 'Галерея (фото)', kg: 'Галерея (сүрөттөр)', keys: ['galleryItems'] },
  { id: 'contacts', ru: 'Контакты', kg: 'Байланыш', keys: ['schoolContactDetails'] },
  { id: 'achievements', ru: 'Достижения', kg: 'Сыйлыктар', keys: ['achievementsSection', 'achievementsList'] },
  { id: 'materials', ru: 'Методические материалы', kg: 'Усулдук материалдар', keys: ['methodologicalMaterials'] },
];

// Block headings, shown when a tab has more than one block
const BLOCK_TITLES: Partial<Record<Section, { ru: string; kg: string }>> = {
  achievementsSection: { ru: 'Заголовки, вкладки и надписи раздела', kg: 'Бөлүмдүн аталыштары жана жазуулары' },
  achievementsList: { ru: 'Награды и победы (фото и тексты)', kg: 'Сыйлыктар жана жеңиштер' },
};

// Technical fields that are kept as-is but not shown in the editor
// ("honor" is no longer shown on the site but may remain in content saved earlier)
const HIDDEN_KEYS = new Set(['id', 'icon', 'fileType', 'fileSize', 'downloadCount', 'honor']);
const IMAGE_KEYS = new Set(['photoUrl', 'imageUrl']);

const LABELS: Record<string, string> = {
  fullName: 'ФИО',
  navName: 'Подпись в шапке сайта',
  shortName: 'Как обращаться (в текстах и чат-боте)',
  title: 'Название / должность',
  city: 'Город',
  school: 'Школа',
  photoUrl: 'Фото учителя',
  photoBadge: 'Значок на фото',
  photoCaption: 'Подпись под именем на фото',
  heroHighlights: 'Карточки под фото',
  experienceYears: 'Лет стажа',
  graduatesCount: 'Выпускников',
  openLessonsCount: 'Открытых уроков',
  olympiadWinnersCount: 'Призёров олимпиад',
  credo: 'Педагогическое кредо (цитата)',
  credoAuthor: 'Подпись к цитате',
  education: 'Образование',
  institution: 'Учебное заведение',
  degree: 'Степень / специальность',
  qualifications: 'Повышение квалификации и сертификаты (фото сертификата и описание видны посетителям)',
  issuer: 'Кем выдано',
  year: 'Год',
  approachPillars: 'Принципы работы',
  number: 'Номер',
  description: 'Описание',
  tag: 'Метка',
  text: 'Текст',
  address: 'Адрес',
  phone: 'Телефон для звонка (только цифры, с +996)',
  phoneDisplay: 'Телефон, как он показан на сайте',
  whatsappUrl: 'Ссылка WhatsApp (https://wa.me/996…)',
  telegramUser: 'Telegram (@имя)',
  telegramUrl: 'Ссылка Telegram (https://t.me/…)',
  email: 'Электронная почта',
  workingHours: 'Часы приёма',
  category: 'Раздел',
  grade: 'Класс',
  subject: 'Предмет',
  duration: 'Длительность',
  highlight: 'Выделить на сайте',
  contentPreview: 'План урока',
  goals: 'Цели',
  equipment: 'Оборудование',
  stages: 'Этапы урока',
  level: 'Уровень',
  badge: 'Значок',
  imageUrl: 'Фото',
  date: 'Дата',
  subtitle: 'Подзаголовок',
  tabAll: 'Вкладка «все»',
  tabTeacher: 'Вкладка наград учителя',
  tabStudents: 'Вкладка успехов учеников',
  yearSuffix: 'Сокращение после года',
  cardNote: 'Подпись внизу карточки',
  certificateButton: 'Кнопка на карточке',
  modalYearLabel: 'Окно сертификата: подпись года',
  modalRegionLabel: 'Окно сертификата: подпись региона',
  modalRegion: 'Окно сертификата: регион',
  modalStatusLabel: 'Окно сертификата: подпись статуса',
  modalStatus: 'Окно сертификата: статус',
  modalCloseButton: 'Окно сертификата: кнопка закрытия',
};

// Labels that depend on where a field is; the key is "<section or list>.<field>"
const SECTION_LABELS: Record<string, string> = {
  'qualifications.title': 'Название курса или сертификата',
  'qualifications.imageUrl': 'Фото или скан сертификата',
  'qualifications.description': 'Описание (видно посетителям в окне сертификата)',
  'achievementsSection.badge': 'Надпись над заголовком',
  'achievementsSection.title': 'Заголовок раздела',
  'achievementsList.title': 'Название награды',
  'achievementsList.badge': 'Метка на карточке',
  'galleryItems.title': 'Название',
  'methodologicalMaterials.title': 'Название',
};

// Fixed choices; the key is "<section>.<field>"
const OPTIONS: Record<string, { value: string; label: string }[]> = {
  'achievementsList.level': [
    { value: 'international', label: 'Международный' },
    { value: 'republican', label: 'Республиканский' },
    { value: 'city', label: 'Городской' },
    { value: 'school', label: 'Школьный' },
  ],
  'achievementsList.category': [
    { value: 'teacher', label: 'Награды учителя' },
    { value: 'students', label: 'Успехи учеников' },
  ],
  'galleryItems.tag': [
    { value: 'alippe', label: 'Алиппе майрамы' },
    { value: 'nooruz', label: 'Нооруз' },
    { value: 'lessons', label: 'Уроки' },
    { value: 'nature', label: 'Сулайман-Тоо / природа' },
    { value: 'crafts', label: 'Творчество' },
  ],
  'methodologicalMaterials.category': [
    { value: 'lesson', label: 'Конспект урока' },
    { value: 'game', label: 'Игра' },
    { value: 'event', label: 'Мероприятие' },
    { value: 'parent', label: 'Для родителей' },
  ],
};

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

function isLocalized(value: unknown): value is { ru: string; kg: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 2 &&
    typeof (value as any).ru === 'string' &&
    typeof (value as any).kg === 'string'
  );
}

/** An empty item shaped like the template (used when adding to a list). */
function blankLike(template: Json, key = ''): Json {
  if (Array.isArray(template)) return [];
  if (template && typeof template === 'object') {
    const result: { [key: string]: Json } = {};
    for (const [k, v] of Object.entries(template)) {
      if (k === 'id') result[k] = `item-${Date.now().toString(36)}`;
      else if (HIDDEN_KEYS.has(k)) result[k] = v;
      else result[k] = blankLike(v, k);
    }
    return result;
  }
  if (typeof template === 'string') return OPTIONS[key] || /^(category|level|tag)$/.test(key) ? template : '';
  if (typeof template === 'boolean') return false;
  return template;
}

/** Finds the default value at a path, treating every list index as its first item. */
function defaultAt(path: (string | number)[]): Json | undefined {
  let node: any = defaultContent;
  for (const step of path) {
    if (node === undefined || node === null) return undefined;
    node = typeof step === 'number' ? node[0] : node[step];
  }
  return node;
}

function itemImage(item: Json): string {
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    for (const key of IMAGE_KEYS) {
      const v = (item as any)[key];
      if (typeof v === 'string' && v) return v;
    }
  }
  return '';
}

function itemTitle(item: Json, lang: Language, index: number): string {
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    for (const key of ['title', 'institution', 'name']) {
      const v = (item as any)[key];
      if (isLocalized(v) && (v[lang] || v.ru)) return v[lang] || v.ru;
      if (typeof v === 'string' && v) return v;
    }
  }
  return `№ ${index + 1}`;
}

/** Shrinks big photos in the browser so uploads stay small and fast. */
async function prepareImage(file: File): Promise<Blob> {
  if (file.type === 'image/gif' || file.size < 300 * 1024) return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Не удалось открыть изображение'));
      el.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Не удалось сжать изображение'))), 'image/jpeg', 0.85)
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

const inputCls =
  'w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700';

export const ContentEditor: React.FC<ContentEditorProps> = ({ lang, token, onUnauthorized, onDirtyChange }) => {
  const t = (ru: string, kg: string) => (lang === 'ru' ? ru : kg);
  const { setContent } = useContentState();

  const [saved, setSaved] = useState<SiteContent | null>(null);
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [tab, setTab] = useState(SECTIONS[0].id);
  const keys = SECTIONS.find((s) => s.id === tab)!.keys;
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  // Translations still running; saving waits for them so the KG texts are not lost
  const [translating, setTranslating] = useState(0);

  const dirty = saved !== null && draft !== null && JSON.stringify(saved) !== JSON.stringify(draft);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    fetch('/api/admin/content', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.status === 401) return onUnauthorized();
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const content = mergeContent(await res.json());
        setSaved(content);
        setDraft(content);
      })
      .catch((e) => setStatus({ kind: 'error', text: `${t('Не удалось загрузить содержимое', 'Жүктөлгөн жок')}: ${e.message}` }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(draft),
      });
      if (res.status === 401) return onUnauthorized();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const content = mergeContent(data.content);
      setSaved(content);
      setDraft(content);
      setContent(content);
      setStatus({
        kind: 'ok',
        text: t('Сохранено. Посетители увидят изменения в течение минуты.', 'Сакталды. Өзгөрүүлөр бир мүнөттүн ичинде көрүнөт.'),
      });
    } catch (e: any) {
      setStatus({ kind: 'error', text: `${t('Ошибка сохранения', 'Сактоо катасы')}: ${e.message}` });
    } finally {
      setSaving(false);
    }
  };

  const translate = async (text: string, from: 'ru' | 'kg'): Promise<string> => {
    setTranslating((n) => n + 1);
    try {
      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text, from }),
      });
      if (res.status === 401) {
        onUnauthorized();
        throw new Error(t('Сессия истекла', 'Сессия бүттү'));
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      return data.text;
    } finally {
      setTranslating((n) => n - 1);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const body = await prepareImage(file);
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': body.type || file.type, Authorization: `Bearer ${token}` },
      body,
    });
    if (res.status === 401) {
      onUnauthorized();
      throw new Error(t('Сессия истекла', 'Сессия бүттү'));
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data.url;
  };

  if (!draft) {
    return (
      <div className="p-8 text-center text-stone-500 text-sm">
        {status ? status.text : <Loader2 className="w-5 h-5 animate-spin mx-auto" />}
      </div>
    );
  }


  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 text-xs font-semibold overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap pb-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setTab(s.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full border cursor-pointer ${
              tab === s.id
                ? 'bg-emerald-800 text-white border-emerald-800'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
          >
            {s[lang]}
          </button>
        ))}
      </div>

      <p className="text-xs text-stone-500">
        {t(
          'Выберите раздел, измените тексты или нажмите «Загрузить фото», затем нажмите «Сохранить» внизу. Пишите текст на одном языке — вторая версия (RU или KG) заполнится автоматическим переводом, его стоит проверить.',
          'Бөлүмдү тандап, текстти өзгөртүңүз же «Сүрөт жүктөө» баскычын басыңыз, андан кийин «Сактоо». Бир тилде жазыңыз — экинчи тил (RU же KG) автоматтык которулат, аны текшериңиз.'
        )}
      </p>

      {keys.map((section) => (
        <div key={section} className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 space-y-4">
          {keys.length > 1 && BLOCK_TITLES[section] && (
            <h4 className="font-serif text-base font-bold text-stone-900">{BLOCK_TITLES[section]![lang]}</h4>
          )}
          {Array.isArray(draft[section]) && (
            <p className="text-xs text-stone-500">
              {t('Нажмите на пункт, чтобы открыть его и изменить текст или фото.', 'Өзгөртүү үчүн пунктту басыңыз.')}
            </p>
          )}
          <FieldEditor
            value={draft[section] as unknown as Json}
            onChange={(value) => setDraft({ ...draft, [section]: value } as SiteContent)}
            path={[section]}
            section={section}
            lang={lang}
            uploadImage={uploadImage}
            translate={translate}
          />
        </div>
      ))}

      {/* Sticky save bar */}
      <div className="sticky -bottom-4 sm:-bottom-6 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-3 bg-white/95 backdrop-blur border-t border-stone-200 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs min-h-[1rem] flex-1 min-w-[10rem]">
          {status ? (
            <span className={`flex items-center gap-1.5 ${status.kind === 'ok' ? 'text-emerald-700' : 'text-red-700'}`}>
              {status.kind === 'ok' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {status.text}
            </span>
          ) : translating > 0 ? (
            <span className="flex items-center gap-1.5 text-stone-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {t('Перевожу…', 'Которулууда…')}
            </span>
          ) : dirty ? (
            <span className="text-amber-700">{t('Есть несохранённые изменения', 'Сакталбаган өзгөрүүлөр бар')}</span>
          ) : (
            <span className="text-stone-400">{t('Все изменения сохранены', 'Баары сакталган')}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDraft(saved);
              setStatus(null);
            }}
            disabled={!dirty || saving}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('Отменить', 'Жокко чыгаруу')}
          </button>
          <button
            onClick={save}
            disabled={!dirty || saving || translating > 0}
            className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg disabled:opacity-40 cursor-pointer"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {t('Сохранить', 'Сактоо')}
          </button>
        </div>
      </div>
    </div>
  );
};

interface FieldEditorProps {
  value: Json;
  onChange: (value: Json) => void;
  path: (string | number)[];
  section: Section;
  lang: Language;
  uploadImage: (file: File) => Promise<string>;
  translate: (text: string, from: 'ru' | 'kg') => Promise<string>;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ value, onChange, path, section, lang, uploadImage, translate }) => {
  const key = String([...path].reverse().find((p) => typeof p === 'string'));
  const optionKey = `${section}.${key}`;

  if (isLocalized(value)) {
    const long = Math.max(value.ru.length, value.kg.length) > 70 || key === 'description' || key === 'text';
    return <LocalizedField value={value} onChange={onChange} long={long} lang={lang} translate={translate} />;
  }

  if (typeof value === 'string') {
    if (IMAGE_KEYS.has(key)) return <ImageField value={value} onChange={onChange} uploadImage={uploadImage} lang={lang} />;
    if (OPTIONS[optionKey]) {
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          {OPTIONS[optionKey].map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }
    return <input value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />;
  }

  if (typeof value === 'number') {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className={`${inputCls} max-w-[10rem]`}
      />
    );
  }

  if (typeof value === 'boolean') {
    return (
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-emerald-700" />
    );
  }

  if (Array.isArray(value)) {
    const move = (from: number, to: number) => {
      const next = [...value];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      onChange(next);
    };
    const add = () => {
      const template = (value[value.length - 1] ?? defaultAt([...path, 0])) as Json;
      if (template === undefined) return;
      onChange([...value, blankLike(template)]);
    };
    return (
      <div className="space-y-3">
        {value.map((item, idx) => (
          <details key={idx} className="group border border-stone-200 rounded-lg bg-stone-50/60" open={value.length <= 2}>
            <summary className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer select-none">
              <span className="flex items-center gap-2 min-w-0">
                {itemImage(item) && (
                  <img
                    key={itemImage(item)}
                    src={itemImage(item)}
                    alt=""
                    onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                    className="w-10 h-10 rounded-md object-cover shrink-0 border border-stone-200 bg-stone-100"
                  />
                )}
                <span className="text-xs font-semibold text-stone-800 truncate">{itemTitle(item, lang, idx)}</span>
              </span>
              <span className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.preventDefault()}>
                <IconButton title="Выше" disabled={idx === 0} onClick={() => move(idx, idx - 1)}>
                  <ArrowUp className="w-3.5 h-3.5" />
                </IconButton>
                <IconButton title="Ниже" disabled={idx === value.length - 1} onClick={() => move(idx, idx + 1)}>
                  <ArrowDown className="w-3.5 h-3.5" />
                </IconButton>
                <IconButton
                  title="Удалить"
                  danger
                  onClick={() => confirm('Удалить этот пункт?') && onChange(value.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </IconButton>
              </span>
            </summary>
            <div className="px-3 pb-3 pt-1 space-y-3 border-t border-stone-200">
              <FieldEditor
                value={item}
                onChange={(v) => onChange(value.map((old, i) => (i === idx ? v : old)))}
                path={[...path, idx]}
                section={section}
                lang={lang}
                uploadImage={uploadImage}
                translate={translate}
              />
            </div>
          </details>
        ))}
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Добавить
        </button>
      </div>
    );
  }

  if (value && typeof value === 'object') {
    return (
      <div className="space-y-4">
        {Object.entries(value)
          .filter(([k]) => !HIDDEN_KEYS.has(k))
          // Photos first, so they are easy to find
          .sort(([a], [b]) => Number(IMAGE_KEYS.has(b)) - Number(IMAGE_KEYS.has(a)))
          .map(([k, v]) => (
            <div key={k}>
              <div className="text-xs font-semibold text-stone-700 mb-1">{SECTION_LABELS[`${key}.${k}`] || SECTION_LABELS[`${section}.${k}`] || LABELS[k] || k}</div>
              <FieldEditor
                value={v}
                onChange={(nv) => onChange({ ...value, [k]: nv })}
                path={[...path, k]}
                section={section}
                lang={lang}
                uploadImage={uploadImage}
                translate={translate}
              />
            </div>
          ))}
      </div>
    );
  }

  return null;
};

type Lang2 = 'ru' | 'kg';
const OTHER: Record<Lang2, Lang2> = { ru: 'kg', kg: 'ru' };

/**
 * A text in Russian and Kyrgyz. When one language is changed, the other is filled in by machine
 * translation, unless the teacher has typed that other text by hand.
 */
const LocalizedField: React.FC<{
  value: { ru: string; kg: string };
  onChange: (value: Json) => void;
  long: boolean;
  lang: Language;
  translate: (text: string, from: Lang2) => Promise<string>;
}> = ({ value, onChange, long, lang, translate }) => {
  const t = (ru: string, kg: string) => (lang === 'ru' ? ru : kg);
  // Which side is being translated into
  const [busy, setBusy] = useState<Lang2 | null>(null);
  const [note, setNote] = useState<{ side: Lang2; kind: 'auto' | 'error'; text: string } | null>(null);
  // Sides typed by hand; automatic translation never overwrites them
  const [typed, setTyped] = useState<Record<Lang2, boolean>>({ ru: false, kg: false });
  const onFocusValue = useRef(value);
  // The translation arrives later; apply it to the latest value and handler, not to stale ones
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };
  const mounted = useRef(true);
  useEffect(() => () => void (mounted.current = false), []);

  const runTranslation = async (from: Lang2) => {
    const to = OTHER[from];
    const source = latest.current.value[from].trim();
    if (!source || busy) return;
    setBusy(to);
    setNote(null);
    try {
      const result = await translate(source, from);
      if (!mounted.current) return;
      latest.current.onChange({ ...latest.current.value, [to]: result });
      setTyped((prev) => ({ ...prev, [to]: false }));
      setNote({ side: to, kind: 'auto', text: t('Переведено автоматически — проверьте текст', 'Автоматтык которулду — текшериңиз') });
    } catch (e: any) {
      if (mounted.current) {
        setNote({ side: to, kind: 'error', text: `${t('Не удалось перевести', 'Которулган жок')}: ${e.message}` });
      }
    } finally {
      if (mounted.current) setBusy(null);
    }
  };

  const field = (l: Lang2) => {
    const props = {
      value: value[l],
      className: inputCls,
      onFocus: () => (onFocusValue.current = value),
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setTyped((prev) => (prev[l] ? prev : { ...prev, [l]: true }));
        if (note?.side === l) setNote(null);
        onChange({ ...value, [l]: e.target.value });
      },
      onBlur: () => {
        if (value[l] !== onFocusValue.current[l] && !typed[OTHER[l]]) runTranslation(l);
      },
    };
    return long ? <textarea rows={3} {...props} /> : <input {...props} />;
  };

  const column = (l: Lang2) => (
    <div>
      <div className="flex items-center justify-between gap-2 h-5">
        <span className="text-[10px] font-bold text-stone-400">{l.toUpperCase()}</span>
        <button
          type="button"
          onClick={() => runTranslation(OTHER[l])}
          disabled={busy !== null || !value[OTHER[l]].trim()}
          title={
            l === 'kg'
              ? t('Перевести русский текст на кыргызский', 'Орусча текстти кыргызчага которуу')
              : t('Перевести кыргызский текст на русский', 'Кыргызча текстти орусчага которуу')
          }
          className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-40 cursor-pointer"
        >
          {busy === l ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
          {l === 'kg' ? t('Перевести с русского', 'Орусчадан которуу') : t('Перевести с кыргызского', 'Кыргызчадан которуу')}
        </button>
      </div>
      {field(l)}
      {note?.side === l && (
        <p className={`text-[10px] mt-0.5 ${note.kind === 'error' ? 'text-red-700' : 'text-amber-700'}`}>{note.text}</p>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {column('ru')}
      {column('kg')}
    </div>
  );
};

const IconButton: React.FC<{
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ title, onClick, disabled, danger, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    disabled={disabled}
    onClick={onClick}
    className={`p-1.5 rounded-md text-stone-400 disabled:opacity-30 cursor-pointer ${
      danger ? 'hover:text-red-600 hover:bg-red-50' : 'hover:text-stone-800 hover:bg-stone-200'
    }`}
  >
    {children}
  </button>
);

const ImageField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  uploadImage: (file: File) => Promise<string>;
  lang: Language;
}> = ({ value, onChange, uploadImage, lang }) => {
  const t = (ru: string, kg: string) => (lang === 'ru' ? ru : kg);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onChange(await uploadImage(file));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        title={t('Выбрать фото', 'Сүрөт тандоо')}
        className="w-full sm:w-40 h-48 sm:h-40 shrink-0 rounded-lg border-2 border-dashed border-stone-300 bg-white overflow-hidden flex flex-col items-center justify-center gap-1 text-stone-400 hover:border-emerald-600 hover:text-emerald-700 cursor-pointer"
      >
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <>
            <ImagePlus className="w-8 h-8" />
            <span className="text-xs font-semibold">{t('Нет фото', 'Сүрөт жок')}</span>
          </>
        )}
      </button>
      <div className="space-y-2 flex-1 w-full">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg disabled:opacity-50 cursor-pointer"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
            {value ? t('Заменить фото', 'Сүрөттү алмаштыруу') : t('Загрузить фото', 'Сүрөт жүктөө')}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 bg-white border border-stone-300 rounded-lg hover:bg-stone-100 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('Убрать', 'Алып салуу')}
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {error && <p className="text-xs text-red-700">{error}</p>}
        <p className="text-[11px] text-stone-400">
          {t(
            'JPG, PNG или WebP. Большие фото уменьшаются автоматически. После загрузки нажмите «Сохранить» внизу.',
            'JPG, PNG же WebP. Чоң сүрөттөр автоматтык түрдө кичирейтилет. Жүктөгөндөн кийин ылдыйдагы «Сактоо» баскычын басыңыз.'
          )}
        </p>
      </div>
    </div>
  );
};
