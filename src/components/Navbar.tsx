import React, { useState, useEffect } from 'react';
import { Language, UserProfile } from '../types';
import {
  BookOpen,
  Globe,
  User,
  Activity,
  Menu,
  X,
  PhoneCall,
  Sparkles,
  LogOut,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenAuth: () => void;
  onOpenDashboard: () => void;
  onOpenChat: () => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onLanguageChange,
  onOpenAuth,
  onOpenDashboard,
  onOpenChat,
  currentUser,
  onLogout,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#about', label: lang === 'ru' ? 'О педагоге' : 'Мугалим жөнүндө' },
    { href: '#methodology', label: lang === 'ru' ? 'Методическая копилка' : 'Усулдук сандык' },
    { href: '#achievements', label: lang === 'ru' ? 'Достижения' : 'Сыйлыктар' },
    { href: '#gallery', label: lang === 'ru' ? 'Школьная жизнь' : 'Мектеп турмушу' },
    { href: '#reviews', label: lang === 'ru' ? 'Отзывы' : 'Пикирлер' },
    { href: '#contact', label: lang === 'ru' ? 'Контакты' : 'Байланыш' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-amber-50/95 backdrop-blur-md shadow-sm border-b border-amber-200/60 py-2.5'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo / Brand */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-700 via-teal-800 to-amber-700 flex items-center justify-center text-white shadow-md shadow-emerald-900/10 transition-transform group-hover:scale-105">
              <BookOpen className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <div className="font-serif text-lg font-bold text-stone-900 leading-tight flex items-center gap-1.5">
                <span>Абдуллаева А. Б.</span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-sans font-semibold tracking-wide uppercase bg-emerald-100 text-emerald-800 rounded">
                  {lang === 'ru' ? 'г. Ош' : 'Ош ш.'}
                </span>
              </div>
              <p className="text-xs text-stone-600 font-medium">
                {lang === 'ru' ? 'Учитель начальных классов • Школа №4' : 'Башталгыч класс мугалими • №4 мектеп'}
              </p>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-stone-700 hover:text-emerald-800 text-sm font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-stone-100/90 p-1 rounded-lg border border-stone-200 text-xs font-semibold">
              <button
                onClick={() => onLanguageChange('ru')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  lang === 'ru'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Русский язык"
              >
                РУ
              </button>
              <button
                onClick={() => onLanguageChange('kg')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  lang === 'kg'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Кыргыз тили"
              >
                КЫРГ
              </button>
            </div>

            {/* AI Assistant Quick Pill */}
            <button
              onClick={onOpenChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-100/80 hover:bg-amber-200/90 text-amber-900 border border-amber-300/80 rounded-lg transition-colors cursor-pointer"
              title={lang === 'ru' ? 'Задать вопрос ИИ-помощнику Айгүл эже' : 'Айгүл эже ИИ-жардамчысына суроо берүү'}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700 animate-spin" style={{ animationDuration: '6s' }} />
              <span>{lang === 'ru' ? 'ИИ-Помощник' : 'ИИ-Кеңешчи'}</span>
            </button>

            {/* Real-time Admin Monitoring Button */}
            <button
              onClick={onOpenDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-lg transition-colors cursor-pointer"
              title={lang === 'ru' ? 'Мониторинг активности и заявок' : 'Активдүүлүктү жана билдирмелерди көзөмөлдөө'}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'ru' ? 'Панель' : 'Көзөмөл'}</span>
            </button>

            {/* User Auth Profile / Login */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-white border border-stone-200 rounded-lg shadow-xs hover:border-emerald-600 transition-colors text-xs font-medium text-stone-800"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="max-w-[100px] truncate">{currentUser.name}</span>
                  <ChevronDown className="w-3 h-3 text-stone-400" />
                </button>
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-lg p-2 z-50 text-xs">
                    <div className="px-2 py-1 text-stone-500 border-b border-stone-100 mb-1">
                      {currentUser.role === 'parent'
                        ? 'Родитель'
                        : currentUser.role === 'colleague'
                        ? 'Коллега-учитель'
                        : 'Член комиссии'}
                    </div>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{lang === 'ru' ? 'Выйти' : 'Чыгуу'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-white border border-stone-300 rounded-lg shadow-xs hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-stone-500" />
                <span>{lang === 'ru' ? 'Войти' : 'Кирүү'}</span>
              </button>
            )}

            {/* Quick Contact CTA */}
            <a
              href="#contact"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{lang === 'ru' ? 'Запись' : 'Жазылуу'}</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => onLanguageChange(lang === 'ru' ? 'kg' : 'ru')}
              className="px-2 py-1 bg-stone-100 text-xs font-bold rounded border border-stone-300"
            >
              {lang === 'ru' ? 'КЫРГ' : 'РУ'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-700 hover:text-stone-900 rounded-lg"
              aria-label="Меню"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-stone-50/95 backdrop-blur-md border-b border-stone-200 px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-stone-800 hover:text-emerald-800 font-medium py-1.5 text-sm"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenChat();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium bg-amber-100 text-amber-900 rounded-lg"
            >
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>{lang === 'ru' ? 'Задать вопрос ИИ-Помощнику' : 'ИИ-Кеңешчиге суроо'}</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDashboard();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium bg-stone-200 text-stone-800 rounded-lg"
            >
              <Activity className="w-4 h-4 text-emerald-700" />
              <span>{lang === 'ru' ? 'Панель активности (онлайн)' : 'Көзөмөл панели (онлайн)'}</span>
            </button>
            {currentUser ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-red-600 bg-red-50 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                <span>{lang === 'ru' ? 'Выйти из профиля' : 'Чыгуу'}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-stone-800 bg-white border border-stone-300 rounded-lg"
              >
                <User className="w-4 h-4" />
                <span>{lang === 'ru' ? 'Вход через соцсети' : 'Соцтармактар аркылуу кирүү'}</span>
              </button>
            )}
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold text-white bg-emerald-700 rounded-lg shadow-sm"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{lang === 'ru' ? 'Записаться на консультацию' : 'Консультацияга жазылуу'}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
