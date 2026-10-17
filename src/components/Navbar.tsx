import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { teacherProfile } from '../data/content';
import { BookOpen, Menu, X, PhoneCall, Sparkles } from 'lucide-react';

interface NavbarProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onLanguageChange,
  onOpenChat,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <a href="#top" className="flex items-center gap-3 group shrink-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-700 via-teal-800 to-amber-700 flex items-center justify-center text-white shadow-md shadow-emerald-900/10 transition-transform group-hover:scale-105">
              <BookOpen className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <div className="font-serif text-lg font-bold text-stone-900 leading-tight flex items-center gap-1.5 whitespace-nowrap">
                <span>{teacherProfile.navName[lang]}</span>
                <span className="hidden sm:inline-block xl:hidden 2xl:inline-block px-2 py-0.5 text-[10px] font-sans font-semibold tracking-wide uppercase bg-emerald-100 text-emerald-800 rounded">
                  {lang === 'ru' ? 'г. Ош' : 'Ош ш.'}
                </span>
              </div>
              <p className="hidden sm:block xl:hidden 2xl:block text-xs text-stone-600 font-medium whitespace-nowrap">
                {lang === 'ru' ? 'Учитель начальных классов • Школа №4' : 'Башталгыч класс мугалими • №4 мектеп'}
              </p>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-4 2xl:gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-stone-700 hover:text-emerald-800 text-sm font-medium whitespace-nowrap transition-colors"
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
              className="flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap text-xs font-medium bg-amber-100/80 hover:bg-amber-200/90 text-amber-900 border border-amber-300/80 rounded-lg transition-colors cursor-pointer"
              title={lang === 'ru' ? 'Задать вопрос ИИ-помощнику' : 'ИИ-жардамчыга суроо берүү'}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700 animate-spin" style={{ animationDuration: '6s' }} />
              <span>{lang === 'ru' ? 'ИИ-Помощник' : 'ИИ-Кеңешчи'}</span>
            </button>

            {/* Quick Contact CTA */}
            <a
              href="#contact"
              className="flex items-center gap-1.5 px-3.5 py-1.5 whitespace-nowrap text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{lang === 'ru' ? 'Запись' : 'Жазылуу'}</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              onClick={() => onLanguageChange(lang === 'ru' ? 'kg' : 'ru')}
              className="md:hidden px-2 py-1 bg-stone-100 text-xs font-bold rounded border border-stone-300"
            >
              {lang === 'ru' ? 'КЫРГ' : 'РУ'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-700 hover:text-stone-900 rounded-lg"
              aria-label={lang === 'ru' ? 'Меню' : 'Меню'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-stone-50/95 backdrop-blur-md border-b border-stone-200 px-4 pt-3 pb-5 space-y-3 shadow-lg">
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
