import React, { useState, useEffect, useCallback } from 'react';
import { Language, ApplicationRecord, ApplicationStatus, AdminStats, Review, ReviewStatus } from '../types';
import { useContent } from '../ContentContext';
import { ContentEditor } from './ContentEditor';
import {
  X,
  Activity,
  Users,
  Download,
  FileCheck,
  Send,
  MessageCircle,
  Phone,
  RefreshCw,
  Clock,
  CheckCircle,
  ShieldCheck,
  AlertCircle,
  Lock,
  LogOut,
  Star,
  Trash2,
  Bot,
  Settings,
  FileText,
  BarChart3,
} from 'lucide-react';

interface AdminDashboardModalProps {
  lang: Language;
  onClose: () => void;
}

type Tab = 'applications' | 'reviews' | 'content' | 'activity' | 'settings';

const TOKEN_KEY = 'teacher_admin_token';

const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, { ru: string; kg: string; cls: string }> = {
  new: { ru: 'Новая', kg: 'Жаңы', cls: 'bg-amber-100 text-amber-900 border-amber-300' },
  contacted: { ru: 'В обработке', kg: 'Иштелүүдө', cls: 'bg-sky-100 text-sky-900 border-sky-300' },
  consulted: { ru: 'Консультация проведена', kg: 'Кеңеш берилди', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  enrolled: { ru: 'Зачислен в класс', kg: 'Класска кабыл алынды', cls: 'bg-purple-100 text-purple-900 border-purple-300' },
  archived: { ru: 'В архиве', kg: 'Архивде', cls: 'bg-stone-100 text-stone-600 border-stone-300' },
};

const REVIEW_STATUS_LABELS: Record<ReviewStatus, { ru: string; kg: string; cls: string }> = {
  pending: { ru: 'Ждёт проверки', kg: 'Текшерилүүдө', cls: 'bg-amber-100 text-amber-900 border-amber-300' },
  approved: { ru: 'Опубликован', kg: 'Жарыяланды', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  rejected: { ru: 'Отклонён', kg: 'Четке кагылды', cls: 'bg-stone-100 text-stone-600 border-stone-300' },
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ lang, onClose: closePanel }) => {
  const { teacherProfile } = useContent();
  const [contentDirty, setContentDirty] = useState(false);
  // Don't lose unsaved edits in the content editor by closing the panel
  const onClose = useCallback(() => {
    if (contentDirty && !confirm('Есть несохранённые изменения в содержимом сайта. Закрыть без сохранения?')) return;
    closePanel();
  }, [contentDirty, closePanel]);
  const t = (ru: string, kg: string) => (lang === 'ru' ? ru : kg);

  const [token, setToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('content');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [telegramTest, setTelegramTest] = useState('');

  const saveToken = (value: string | null) => {
    setToken(value);
    try {
      if (value) sessionStorage.setItem(TOKEN_KEY, value);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch {}
  };

  const api = useCallback(
    async (url: string, init: RequestInit = {}) => {
      const res = await fetch(url, {
        ...init,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers },
      });
      if (res.status === 401) {
        saveToken(null);
        throw new Error(t('Сессия истекла, войдите снова', 'Сессия бүттү, кайра кириңиз'));
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      return data;
    },
    [token, lang]
  );

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [statsData, appsData, reviewsData] = await Promise.all([
        api('/api/admin/stats'),
        api('/api/admin/applications'),
        api('/api/admin/reviews'),
      ]);
      setStats(statsData);
      setApplications(appsData.applications || []);
      setReviews(reviewsData.reviews || []);
      setLoadError('');
    } catch (e: any) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  }, [api, token]);

  useEffect(() => {
    if (!token) return;
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, [token, fetchDashboardData]);

  // Close on Escape, lock page scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t('Ошибка входа', 'Кирүү катасы'));
      setPassword('');
      saveToken(data.token);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await api('/api/admin/logout', { method: 'POST' }).catch(() => {});
    saveToken(null);
    setStats(null);
    setApplications([]);
    setReviews([]);
  };

  const updateApplication = async (id: string, patch: Partial<Pick<ApplicationRecord, 'status' | 'adminNote'>>) => {
    try {
      const data = await api(`/api/admin/applications/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      setApplications((prev) => prev.map((a) => (a.id === id ? data.application : a)));
    } catch (e: any) {
      setLoadError(e.message);
    }
  };

  const deleteApplication = async (app: ApplicationRecord) => {
    if (!confirm(t(`Удалить заявку «${app.name}» навсегда?`, `«${app.name}» билдирмесин өчүрөсүзбү?`))) return;
    try {
      await api(`/api/admin/applications/${app.id}`, { method: 'DELETE' });
      setApplications((prev) => prev.filter((a) => a.id !== app.id));
    } catch (e: any) {
      setLoadError(e.message);
    }
  };

  const updateReview = async (id: string, status: ReviewStatus) => {
    try {
      const data = await api(`/api/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setReviews((prev) => prev.map((r) => (r.id === id ? data.review : r)));
    } catch (e: any) {
      setLoadError(e.message);
    }
  };

  const deleteReview = async (review: Review) => {
    if (!confirm(t(`Удалить отзыв «${review.author}» навсегда?`, `«${review.author}» пикирин өчүрөсүзбү?`))) return;
    try {
      await api(`/api/admin/reviews/${review.id}`, { method: 'DELETE' });
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch (e: any) {
      setLoadError(e.message);
    }
  };

  const runTelegramTest = async () => {
    setTelegramTest('…');
    try {
      const data = await api('/api/admin/telegram-test', { method: 'POST' });
      setTelegramTest(
        data.result === 'sent'
          ? t('✓ Сообщение отправлено — проверьте Telegram', '✓ Билдирүү жөнөтүлдү')
          : data.result === 'disabled'
          ? t('Telegram не настроен (нет TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)', 'Telegram жөндөлгөн эмес')
          : t('Ошибка отправки — проверьте токен и chat_id', 'Жөнөтүү катасы')
      );
    } catch (e: any) {
      setTelegramTest(e.message);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div
      className={`fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-md flex items-center justify-center overflow-y-auto ${
        token ? 'sm:p-6' : 'p-3 sm:p-6'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={t('Админ-панель', 'Админ панели')}
    >
      {children}
    </div>
  );

  // ---------------------------------------------------------------- Login
  if (!token) {
    return shell(
      <form
        onSubmit={handleLogin}
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-stone-200 p-7 relative text-left space-y-4"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-800 rounded-full cursor-pointer"
          aria-label={t('Закрыть', 'Жабуу')}
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-11 h-11 bg-stone-900 text-emerald-400 rounded-xl flex items-center justify-center">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif text-2xl font-bold text-stone-900">{t('Вход для администратора', 'Администратор үчүн кирүү')}</h3>
          <p className="text-stone-500 text-xs mt-1">{teacherProfile.fullName[lang]}</p>
        </div>
        <input
          type="password"
          autoFocus
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('Пароль', 'Сырсөз')}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
        />
        {loginError && (
          <p className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{loginError}</span>
          </p>
        )}
        <button
          type="submit"
          disabled={loggingIn || !password}
          className="w-full py-2.5 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-xl transition-colors cursor-pointer"
        >
          {loggingIn ? t('Проверка…', 'Текшерилүүдө…') : t('Войти', 'Кирүү')}
        </button>
      </form>
    );
  }

  // ---------------------------------------------------------------- Dashboard
  const filteredApplications =
    statusFilter === 'all' ? applications : applications.filter((a) => a.status === statusFilter);
  const pendingReviews = reviews.filter((r) => r.status === 'pending').length;
  const maxDaily = Math.max(1, ...(stats?.last7Days.map((d) => d.visits) || [0]));

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'content', label: t('Тексты и фото', 'Тексттер жана сүрөттөр'), icon: <FileText className="w-4 h-4" /> },
    {
      id: 'applications',
      label: `${t('Заявки', 'Билдирмелер')}${stats?.newApplications ? ` • ${stats.newApplications}` : ''}`,
      icon: <FileCheck className="w-4 h-4" />,
    },
    {
      id: 'reviews',
      label: `${t('Отзывы', 'Пикирлер')}${pendingReviews ? ` • ${pendingReviews}` : ''}`,
      icon: <Star className="w-4 h-4" />,
    },
    { id: 'activity', label: t('Статистика', 'Статистика'), icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: t('Интеграции', 'Интеграциялар'), icon: <Settings className="w-4 h-4" /> },
  ];

  return shell(
    <div className="bg-stone-50 w-full max-w-5xl h-[100dvh] sm:h-[92vh] sm:rounded-2xl shadow-2xl sm:border border-stone-300 overflow-hidden flex flex-col text-left">
      {/* Top Header */}
      <div className="shrink-0 bg-stone-900 text-white px-4 py-3 sm:p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/50 text-emerald-400 items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif text-lg sm:text-xl font-bold truncate">{t('Админ-панель сайта', 'Сайттын админ панели')}</h3>
            <p className="hidden sm:block text-xs text-stone-400 truncate">
              {t('Тексты и фото сайта, заявки родителей, отзывы', 'Сайттын тексттери жана сүрөттөрү, билдирмелер, пикирлер')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={fetchDashboardData}
            title={t('Обновить данные', 'Жаңылоо')}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleLogout}
            title={t('Выйти', 'Чыгуу')}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            title={t('Закрыть', 'Жабуу')}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loadError && (
        <div className="shrink-0 px-5 py-2 bg-red-50 border-b border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{loadError}</span>
        </div>
      )}

      {stats?.integrations.storage === 'missing' && (
        <div className="shrink-0 px-5 py-3 bg-amber-50 border-b border-amber-300 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {t(
              'Хранилище не подключено: заявки, отзывы, тексты и фото сейчас не сохраняются. В Vercel откройте проект → Storage → Create → Blob (доступ Private), подключите его к проекту и сделайте Redeploy.',
              'Сактагыч туташкан эмес: билдирмелер, пикирлер, тексттер жана сүрөттөр сакталбайт. Vercelде долбоорду ачып → Storage → Create → Blob (Private) туташтырып, Redeploy жасаңыз.'
            )}
          </span>
        </div>
      )}

      {/* Tab selection */}
      <div className="shrink-0 px-2 sm:px-5 border-b border-stone-200 bg-white flex gap-1 sm:gap-4 text-xs sm:text-sm font-semibold overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-2 py-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body content */}
      <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
        {activeTab === 'applications' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
              {(['all', ...Object.keys(APPLICATION_STATUS_LABELS)] as (ApplicationStatus | 'all')[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-full border cursor-pointer ${
                    statusFilter === s
                      ? 'bg-emerald-800 text-white border-emerald-800'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {s === 'all' ? t('Все', 'Баары') : APPLICATION_STATUS_LABELS[s][lang]} (
                  {s === 'all' ? applications.length : applications.filter((a) => a.status === s).length})
                </button>
              ))}
            </div>

            {filteredApplications.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-sm bg-white rounded-xl border border-stone-200">
                {t('Заявок пока нет', 'Азырынча билдирме жок')}
              </div>
            ) : (
              filteredApplications.map((app) => {
                const digits = app.phone.replace(/\D/g, '');
                const status = APPLICATION_STATUS_LABELS[app.status];
                const noteDraft = notes[app.id] ?? app.adminNote;
                return (
                  <div key={app.id} className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-stone-900 text-sm sm:text-base">{app.name}</h4>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${status.cls}`}>
                            {status[lang]}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500">
                          {app.phone}
                          {app.studentAgeOrGrade && ` • ${app.studentAgeOrGrade}`} • {t('Связь', 'Байланыш')}:{' '}
                          <span className="font-semibold text-emerald-700">{app.preferredMessenger}</span>
                        </p>
                      </div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(app.createdAt)}
                      </div>
                    </div>

                    <div className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                      <span className="font-semibold text-stone-900">{app.purpose}: </span>
                      <span className="whitespace-pre-line">{app.comment || t('Без комментария', 'Түшүндүрмөсүз')}</span>
                    </div>

                    <textarea
                      rows={2}
                      value={noteDraft}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [app.id]: e.target.value }))}
                      onBlur={() => noteDraft !== app.adminNote && updateApplication(app.id, { adminNote: noteDraft })}
                      placeholder={t('Заметка для себя (сохраняется автоматически)…', 'Өзүңүз үчүн эскертме…')}
                      className="w-full px-3 py-2 text-xs bg-amber-50/40 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                        {app.notification.telegram === 'sent' ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t('Уведомление отправлено в Telegram', 'Telegramга жөнөтүлдү')}</span>
                          </>
                        ) : app.notification.telegram === 'failed' ? (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>{t('Не удалось отправить в Telegram', 'Telegramга жөнөтүлгөн жок')}</span>
                          </>
                        ) : (
                          <span>{t('Telegram-уведомления выключены', 'Telegram билдирүүлөрү өчүк')}</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`https://wa.me/${digits}?text=${encodeURIComponent(
                            `Здравствуйте, ${app.name}! Это ${teacherProfile.fullName.ru}, учитель начальных классов. Получила вашу заявку: ${app.purpose}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                        <a
                          href={`tel:+${digits}`}
                          className="flex items-center gap-1 px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-lg font-semibold transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{t('Позвонить', 'Чалуу')}</span>
                        </a>
                        <select
                          value={app.status}
                          onChange={(e) => updateApplication(app.id, { status: e.target.value as ApplicationStatus })}
                          className="px-2 py-1.5 bg-stone-100 border border-stone-300 rounded-lg text-xs font-medium cursor-pointer"
                          aria-label={t('Статус заявки', 'Билдирменин абалы')}
                        >
                          {(Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[]).map((s) => (
                            <option key={s} value={s}>
                              {APPLICATION_STATUS_LABELS[s][lang]}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => deleteApplication(app)}
                          title={t('Удалить', 'Өчүрүү')}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-3">
            <p className="text-xs text-stone-500">
              {t(
                'Отзывы появляются на сайте только после того, как вы нажмёте «Опубликовать».',
                'Пикирлер «Жарыялоо» баскычын баскандан кийин гана сайтта көрүнөт.'
              )}
            </p>
            {reviews.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-sm bg-white rounded-xl border border-stone-200">
                {t('Отзывов пока нет', 'Азырынча пикир жок')}
              </div>
            ) : (
              reviews.map((rev) => {
                const status = REVIEW_STATUS_LABELS[rev.status];
                return (
                  <div key={rev.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-stone-900">{rev.author}</span>
                        {rev.role && <span className="text-xs text-stone-500">{rev.role}</span>}
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${status.cls}`}>
                          {status[lang]}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < rev.rating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-stone-700 whitespace-pre-line">{rev.text}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-stone-400">{formatDateTime(rev.createdAt)}</span>
                      <div className="flex items-center gap-2 text-xs">
                        {rev.status !== 'approved' && (
                          <button
                            onClick={() => updateReview(rev.id, 'approved')}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold cursor-pointer"
                          >
                            {t('Опубликовать', 'Жарыялоо')}
                          </button>
                        )}
                        {rev.status !== 'rejected' && (
                          <button
                            onClick={() => updateReview(rev.id, 'rejected')}
                            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-lg font-semibold cursor-pointer"
                          >
                            {rev.status === 'approved' ? t('Скрыть', 'Жашыруу') : t('Отклонить', 'Четке кагуу')}
                          </button>
                        )}
                        <button
                          onClick={() => deleteReview(rev)}
                          title={t('Удалить', 'Өчүрүү')}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: t('Посещений сегодня', 'Бүгүнкү кирүүлөр'),
                  value: stats?.visitsToday ?? '—',
                  sub: `${t('всего', 'бардыгы')}: ${stats?.totalVisits ?? '—'}`,
                  icon: <Users className="w-4 h-4 text-stone-400" />,
                },
                {
                  label: t('Новые заявки', 'Жаңы билдирмелер'),
                  value: stats?.newApplications ?? '—',
                  sub: `${t('всего', 'бардыгы')}: ${stats?.totalApplications ?? '—'}`,
                  icon: <FileCheck className="w-4 h-4 text-stone-400" />,
                },
                {
                  label: t('Скачиваний', 'Жүктөөлөр'),
                  value: stats?.totalDownloads ?? '—',
                  sub: t('методических материалов', 'усулдук материалдар'),
                  icon: <Download className="w-4 h-4 text-stone-400" />,
                },
                {
                  label: t('Вопросов ИИ-помощнику', 'ИИ-жардамчыга суроолор'),
                  value: stats?.totalChatQueries ?? '—',
                  sub: `${t('отзывов ждут', 'пикир күтүүдө')}: ${stats?.pendingReviews ?? '—'}`,
                  icon: <Bot className="w-4 h-4 text-stone-400" />,
                },
              ].map((card) => (
                <div key={card.label} className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
                  <div className="flex items-center justify-between text-stone-500 text-xs mb-1 gap-2">
                    <span>{card.label}</span>
                    {card.icon}
                  </div>
                  <div className="font-serif text-2xl font-bold text-stone-900">{card.value}</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">{card.sub}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-xs font-semibold text-stone-700 mb-3">{t('Посещения за 7 дней', '7 күндүк кирүүлөр')}</p>
              <div className="flex items-end gap-2 h-28">
                {stats?.last7Days.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[10px] text-stone-500">{d.visits}</span>
                    <div
                      className="w-full bg-emerald-600 rounded-t"
                      style={{ height: `${Math.max(2, (d.visits / maxDaily) * 100)}%` }}
                    />
                    <span className="text-[10px] text-stone-400">
                      {new Date(d.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
              {stats && stats.recentActivities.length > 0 ? (
                stats.recentActivities.map((act) => (
                  <div key={act.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                        {act.type === 'download' ? (
                          <Download className="w-4 h-4" />
                        ) : act.type === 'application' ? (
                          <FileCheck className="w-4 h-4 text-amber-600" />
                        ) : act.type === 'chat_query' ? (
                          <MessageCircle className="w-4 h-4 text-sky-600" />
                        ) : act.type === 'review' ? (
                          <Star className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Activity className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-stone-900">{act.title}</p>
                        <p className="text-stone-500 mt-0.5 break-words">{act.details}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-stone-400 shrink-0 font-medium">{formatDateTime(act.createdAt)}</span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-stone-400 text-xs">{t('Событий пока нет', 'Окуялар азырынча жок')}</div>
              )}
            </div>
          </div>
        )}

        {/* Kept mounted while hidden so switching tabs does not drop unsaved edits */}
        <div className={activeTab === 'content' ? '' : 'hidden'}>
          <ContentEditor
            lang={lang}
            token={token}
            onUnauthorized={() => saveToken(null)}
            onDirtyChange={setContentDirty}
          />
        </div>

        {activeTab === 'settings' && (
          <div className="space-y-4 text-xs">
            <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">{t('Уведомления в Telegram', 'Telegram билдирүүлөрү')}</h4>
                    <p className="text-stone-500">{t('О новых заявках и отзывах', 'Жаңы билдирмелер жана пикирлер жөнүндө')}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 font-bold rounded text-[11px] ${
                    stats?.integrations.telegram ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {stats?.integrations.telegram ? t('Подключено', 'Туташкан') : t('Не настроено', 'Жөндөлгөн эмес')}
                </span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                {t(
                  'Чтобы получать заявки в Telegram: создайте бота через @BotFather, напишите боту любое сообщение и задайте на сервере переменные TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID.',
                  'Telegramдан билдирме алуу үчүн @BotFather аркылуу бот түзүп, серверге TELEGRAM_BOT_TOKEN жана TELEGRAM_CHAT_ID өзгөрмөлөрүн кошуңуз.'
                )}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={runTelegramTest}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold cursor-pointer"
                >
                  {t('Отправить тестовое сообщение', 'Тест билдирүү жөнөтүү')}
                </button>
                {telegramTest && <span className="text-stone-600">{telegramTest}</span>}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">{t('ИИ-помощник (Gemini)', 'ИИ-жардамчы (Gemini)')}</h4>
                    <p className="text-stone-500">
                      {t('Модель', 'Модель')}: {stats?.integrations.geminiModel ?? '—'}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 font-bold rounded text-[11px] ${
                    stats?.integrations.gemini ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {stats?.integrations.gemini ? t('Подключено', 'Туташкан') : t('Шаблонные ответы', 'Шаблон жооптор')}
                </span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                {t(
                  'Без ключа GEMINI_API_KEY чат-бот отвечает заготовленным текстом. Ключ можно получить бесплатно в Google AI Studio.',
                  'GEMINI_API_KEY ачкычы жок болсо, чат-бот даяр текст менен жооп берет.'
                )}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-stone-200 flex items-start gap-3">
              <Settings className="w-5 h-5 text-stone-500 shrink-0" />
              <p className="text-stone-600 leading-relaxed">
                {t(
                  'Имя, фото, контакты и все тексты сайта меняются во вкладке «Тексты и фото». Пароль этой панели задаётся переменной ADMIN_PASSWORD в настройках Vercel.',
                  'Аты-жөнү, сүрөт, байланыштар жана сайттын бардык тексттери «Тексттер жана сүрөттөр» өтмөгүндө өзгөртүлөт. Бул панелдин сырсөзү Vercelдеги ADMIN_PASSWORD өзгөрмөсү менен коюлат.'
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="hidden sm:flex shrink-0 bg-stone-100 px-4 sm:px-6 py-3 border-t border-stone-200 items-center justify-between gap-3 text-xs text-stone-500">
        <span>{t('Данные обновляются каждые 15 секунд', 'Маалымат ар 15 секунд сайын жаңыланат')}</span>
        <button
          onClick={onClose}
          className="px-4 py-2 font-semibold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-200 cursor-pointer"
        >
          {t('На сайт', 'Сайтка')}
        </button>
      </div>
    </div>
  );
};
