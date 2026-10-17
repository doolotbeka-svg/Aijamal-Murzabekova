import React, { useState, useEffect } from 'react';
import { Language, MethodMaterial } from './types';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { MethodologySection } from './components/MethodologySection';
import { AchievementsSection } from './components/AchievementsSection';
import { GallerySection } from './components/GallerySection';
import { ReviewsSection } from './components/ReviewsSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AiChatbot } from './components/AiChatbot';

const ADMIN_HASH = '#admin';
const LANG_KEY = 'teacher_portfolio_lang';

function track(body: Record<string, string>) {
  fetch('/api/telemetry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {});
}

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      return localStorage.getItem(LANG_KEY) === 'kg' ? 'kg' : 'ru';
    } catch {
      return 'ru';
    }
  });

  // The admin panel is hidden: it is only reachable by opening site#admin
  const [adminOpen, setAdminOpen] = useState(() => window.location.hash === ADMIN_HASH);
  const [chatBotOpen, setChatBotOpen] = useState(false);

  useEffect(() => {
    const onHashChange = () => setAdminOpen(window.location.hash === ADMIN_HASH);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'kg' ? 'ky' : 'ru';
  }, [lang]);

  // Count one visit per browser session (not on every reload)
  useEffect(() => {
    try {
      if (sessionStorage.getItem('visit_tracked')) return;
      sessionStorage.setItem('visit_tracked', '1');
    } catch {}
    track({ type: 'visit' });
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem(LANG_KEY, newLang);
    } catch {}
  };

  const closeAdmin = () => {
    setAdminOpen(false);
    // Drop "#admin" from the address bar without adding a history entry
    history.replaceState(null, '', window.location.pathname + window.location.search);
  };

  const handleTrackDownload = (material: MethodMaterial) => {
    track({ type: 'download', details: `${material.title.ru} (${material.grade})` });
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Sticky Navigation */}
      <Navbar lang={lang} onLanguageChange={handleLanguageChange} onOpenChat={() => setChatBotOpen(true)} />

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
        <MethodologySection lang={lang} onTrackDownload={handleTrackDownload} />

        {/* Achievements and Student Awards */}
        <AchievementsSection lang={lang} />

        {/* Gallery of School Life (Alippe, Nooruz, Lessons, Osh landmarks) */}
        <GallerySection lang={lang} />

        {/* Moderated testimonials from parents & colleagues */}
        <ReviewsSection lang={lang} />

        {/* Contacts, School Location in Osh, Booking Form */}
        <ContactSection lang={lang} />
      </main>

      {/* Footer */}
      <Footer lang={lang} />

      {/* Hidden admin panel (site#admin), password protected on the server */}
      {adminOpen && <AdminDashboardModal lang={lang} onClose={closeAdmin} />}

      {/* Pedagogical AI Chatbot */}
      {!adminOpen && (
        <AiChatbot lang={lang} isOpen={chatBotOpen} onToggle={() => setChatBotOpen(!chatBotOpen)} />
      )}
    </div>
  );
}
