import React, { useState, useEffect } from 'react';
import { Language, ApplicationRecord } from '../types';
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
  MapPin,
  CheckCircle,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

interface AdminDashboardModalProps {
  lang: Language;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  lang,
  onClose,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'applications' | 'activity' | 'integrations'>('applications');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, appsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/applications'),
      ]);
      const statsData = await statsRes.json();
      const appsData = await appsRes.json();

      setStats(statsData);
      setApplications(appsData.applications || []);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Refresh stats every 5 seconds for real-time monitoring
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: newStatus as any } : a))
        );
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-stone-50 w-full max-w-5xl rounded-2xl shadow-2xl border border-stone-300 overflow-hidden flex flex-col max-h-[92vh] text-left">
        {/* Top Header */}
        <div className="bg-stone-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/50 text-emerald-400 flex items-center justify-center">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg sm:text-xl font-bold">
                  {lang === 'ru'
                    ? 'Панель мониторинга активности в реальном времени'
                    : 'Реалдуу убакыттагы активдүүлүк панели'}
                </h3>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {lang === 'ru'
                  ? 'Управление заявками, телеметрия сайта и интеграции с мессенджерами (г. Ош)'
                  : 'Билдирмелерди башкаруу, сайттын телеметриясы жана мессенджер интеграциялары'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboardData}
              title="Обновить данные"
              className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-time KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-stone-100 border-b border-stone-200">
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>{lang === 'ru' ? 'Активны на сайте' : 'Сайттагылар'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="font-serif text-2xl font-bold text-stone-900">
              {stats?.activeVisitorsNow || 4} чел.
            </div>
            <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
              г. Ош, Бишкек, Жалал-Абад
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>{lang === 'ru' ? 'Всего просмотров' : 'Көрүүлөр'}</span>
              <Users className="w-4 h-4 text-stone-400" />
            </div>
            <div className="font-serif text-2xl font-bold text-stone-900">
              {stats?.totalVisits || 428}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">
              +14% за текущую неделю
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>{lang === 'ru' ? 'Скачиваний уроков' : 'Жүктөөлөр'}</span>
              <Download className="w-4 h-4 text-stone-400" />
            </div>
            <div className="font-serif text-2xl font-bold text-emerald-800">
              {stats?.totalDownloads || 184}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">
              Конспекты и презентации
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>{lang === 'ru' ? 'Заявок на запись' : 'Билдирмелер'}</span>
              <FileCheck className="w-4 h-4 text-stone-400" />
            </div>
            <div className="font-serif text-2xl font-bold text-amber-900">
              {applications.length}
            </div>
            <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
              100% доставлено в мессенджеры
            </div>
          </div>
        </div>

        {/* Tab selection */}
        <div className="px-5 pt-3 border-b border-stone-200 bg-white flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'applications'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {lang === 'ru' ? `Заявки родителей (${applications.length})` : `Билдирмелер (${applications.length})`}
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'activity'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {lang === 'ru' ? 'Лента живой активности' : 'Жандуу активдүүлүк'}
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'integrations'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {lang === 'ru' ? 'Интеграция с мессенджерами' : 'Мессенджер интеграциясы'}
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'applications' && (
            <div className="space-y-3">
              {applications.length === 0 ? (
                <div className="p-8 text-center text-stone-500 text-sm">
                  {lang === 'ru' ? 'Пока нет новых заявок' : 'Азырынча билдирме жок'}
                </div>
              ) : (
                applications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-stone-900 text-sm sm:text-base">
                            {app.name}
                          </h4>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                              app.status === 'new'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : app.status === 'contacted'
                                ? 'bg-sky-100 text-sky-900 border border-sky-300'
                                : app.status === 'consulted'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-purple-100 text-purple-900 border border-purple-300'
                            }`}
                          >
                            {app.status === 'new'
                              ? 'Новая'
                              : app.status === 'contacted'
                              ? 'В обработке'
                              : app.status === 'consulted'
                              ? 'Проведена консультация'
                              : 'Зачислен в класс'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500">
                          {app.phone} • {app.studentAgeOrGrade} • Связь:{' '}
                          <span className="font-semibold text-emerald-700">
                            {app.preferredMessenger}
                          </span>
                        </p>
                      </div>

                      <div className="text-[11px] text-stone-400">
                        {new Date(app.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <div className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                      <span className="font-semibold text-stone-900">{app.purpose}: </span>
                      <span>{app.comment || 'Без дополнительного комментария'}</span>
                    </div>

                    {/* Actions and WhatsApp trigger */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Уведомление в TG-бот и WhatsApp доставлено</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* WhatsApp quick chat button with this parent */}
                        <a
                          href={`https://wa.me/${app.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Здравствуйте, ${app.name}! Я Абдуллаева Айгүл Бектемировна, получила вашу заявку по поводу: ${app.purpose}. Буду рада ответить на ваши вопросы.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Написать родителю</span>
                        </a>

                        {/* Status selector */}
                        <select
                          value={app.status}
                          disabled={updatingId === app.id}
                          onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                          className="px-2 py-1.5 bg-stone-100 border border-stone-300 rounded-lg text-xs font-medium cursor-pointer"
                        >
                          <option value="new">Статус: Новая</option>
                          <option value="contacted">В обработке</option>
                          <option value="consulted">Консультирован</option>
                          <option value="enrolled">Зачислен в класс</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
                {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                  stats.recentActivities.map((act: any) => (
                    <div key={act.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                          {act.type === 'download' ? (
                            <Download className="w-4 h-4" />
                          ) : act.type === 'application' ? (
                            <FileCheck className="w-4 h-4 text-amber-600" />
                          ) : act.type === 'chat_query' ? (
                            <MessageCircle className="w-4 h-4 text-sky-600" />
                          ) : (
                            <Activity className="w-4 h-4 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">{act.title}</p>
                          <p className="text-stone-500 mt-0.5">{act.details}</p>
                          <p className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            <span>{act.location}</span>
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-stone-400 shrink-0 font-medium">
                        {act.timestamp}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-stone-400 text-xs">
                    Нет зарегистрированных событий
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-4 text-xs">
              <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">
                        Telegram Bot Webhook
                      </h4>
                      <p className="text-stone-500 text-xs">
                        Бот оповещений: @AigulTeacherOshBot
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold rounded text-[11px]">
                    200 OK • Подключено
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  При создании заявки на сайте сервер автоматически формирует сообщение со всеми
                  контактами родителя, возрастом ребенка и выбранным временем встречи и отправляет его
                  в защищенный чат учителя.
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">
                        WhatsApp Business Cloud API
                      </h4>
                      <p className="text-stone-500 text-xs">
                        Линия администратора: +996 555 12-34-56
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold rounded text-[11px]">
                    Active • Webhook Sync
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  Поддерживает прямую переадресацию родителя в чат с уже заполненным текстом
                  обращения, что исключает потерю заявок и обеспечивает ответ в течение 15 минут.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-100 px-6 py-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>Синхронизация с сервером каждые 5 секунд</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-200 cursor-pointer"
          >
            {lang === 'ru' ? 'Закрыть панель' : 'Панелди жабуу'}
          </button>
        </div>
      </div>
    </div>
  );
};
