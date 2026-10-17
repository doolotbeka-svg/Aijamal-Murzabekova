import React, { useState, useEffect } from 'react';
import { Language, UserProfile, MethodMaterial, ApplicationRecord } from './types';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { MethodologySection } from './components/MethodologySection';
import { AchievementsSection } from './components/AchievementsSection';
import { GallerySection } from './components/GallerySection';
import { ReviewsSection } from './components/ReviewsSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AiChatbot } from './components/AiChatbot';

export default function App() {
  const [lang, setLang] = useState<Language>('ru');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('teacher_portfolio_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false);
  const [chatBotOpen, setChatBotOpen] = useState(false);

  // Track initial page visit on mount
  useEffect(() => {
    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'visit',
        title: 'Посещение портфолио',
        details: 'Просмотр главной страницы портфолио',
        location: 'г. Ош (Посетитель)',
      }),
    }).catch(() => {});
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'visit',
        title: 'Переключение языка',
        details: `Пользователь переключил интерфейс на ${newLang === 'ru' ? 'Русский' : 'Кыргызча'}`,
        location: 'г. Ош',
      }),
    }).catch(() => {});
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('teacher_portfolio_user', JSON.stringify(user));
    } catch {}
    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'visit',
        title: 'Авторизация пользователя',
        details: `${user.name} (${user.role}) вошел через ${user.provider}`,
        location: 'г. Ош',
      }),
    }).catch(() => {});
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('teacher_portfolio_user');
    } catch {}
  };

  const handleTrackDownload = (material: MethodMaterial) => {
    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'download',
        title: 'Скачивание материала',
        details: `${material.title[lang]} (${material.fileType})`,
        location: 'г. Ош (Педагог / Родитель)',
      }),
    }).catch(() => {});
  };

  const handleApplicationCreated = (app: ApplicationRecord) => {
    // Application is already submitted and recorded via /api/applications
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Sticky Navigation */}
      <Navbar
        lang={lang}
        onLanguageChange={handleLanguageChange}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenDashboard={() => setDashboardModalOpen(true)}
        onOpenChat={() => setChatBotOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main>
        {/* Hero Section with Credo and Badges */}
        <HeroSection
          lang={lang}
          onOpenBooking={() => {
            const el = document.getElementById('contact');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenAchievements={() => {
            const el = document.getElementById('achievements');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* About Section: Education, Qualifications, 4 Pillars of Approach */}
        <AboutSection lang={lang} />

        {/* Methodological Bank & Interactive Lessons */}
        <MethodologySection
          lang={lang}
          onTrackDownload={handleTrackDownload}
        />

        {/* Achievements and Student Awards */}
        <AchievementsSection lang={lang} />

        {/* Gallery of School Life (Alippe, Nooruz, Lessons, Osh landmarks) */}
        <GallerySection lang={lang} />

        {/* Testimonials from Parents & Colleagues */}
        <ReviewsSection lang={lang} />

        {/* Contacts, School Location in Osh, Booking Form with Messenger Notifications */}
        <ContactSection
          lang={lang}
          onApplicationCreated={handleApplicationCreated}
        />
      </main>

      {/* Footer */}
      <Footer lang={lang} />

      {/* Social Login Modal */}
      {authModalOpen && (
        <AuthModal
          lang={lang}
          onClose={() => setAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Real-time Admin Monitoring Dashboard */}
      {dashboardModalOpen && (
        <AdminDashboardModal
          lang={lang}
          onClose={() => setDashboardModalOpen(false)}
        />
      )}

      {/* Pedagogical AI Chatbot */}
      <AiChatbot
        lang={lang}
        isOpen={chatBotOpen}
        onToggle={() => setChatBotOpen(!chatBotOpen)}
      />
    </div>
  );
}
