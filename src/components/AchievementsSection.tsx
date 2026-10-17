import React, { useState } from 'react';
import { Language, Achievement } from '../types';
import { useContent } from '../ContentContext';
import {
  Award,
  Trophy,
  Medal,
  Calendar,
  Building,
  CheckCircle,
  Sparkles,
  Eye,
  X,
  ShieldCheck,
} from 'lucide-react';

interface AchievementsSectionProps {
  lang: Language;
}

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({ lang }) => {
  const { achievementsList } = useContent();
  const [activeTab, setActiveTab] = useState<'all' | 'teacher' | 'students'>('all');
  const [selectedAward, setSelectedAward] = useState<Achievement | null>(null);

  const filteredAchievements =
    activeTab === 'all'
      ? achievementsList
      : achievementsList.filter((a) => a.category === activeTab);

  return (
    <section id="achievements" className="py-20 bg-stone-50 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            {lang === 'ru' ? 'Признание и результаты' : 'Таануу жана натыйжалар'}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-3 mb-4">
            {lang === 'ru' ? 'Достижения, государственные награды и победы' : 'Мамлекеттик сыйлыктар жана окуучулардын жеңиштери'}
          </h2>
          <p className="text-stone-600 text-base leading-relaxed">
            {lang === 'ru'
              ? 'Официальные награды Министерства образования и науки КР, мэрии г. Ош и триумфы наших учеников на городских олимпиадах.'
              : 'КР Билим берүү жана илим министрлигинин, Ош шаарынын мэриясынын сыйлыктары жана окуучуларыбыздын шаардык олимпиадалардагы жеңиштери.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-10">
          <div className="bg-stone-200/80 p-1.5 rounded-xl flex gap-1 border border-stone-300/60">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {lang === 'ru' ? 'Все награды' : 'Бардык сыйлыктар'}
            </button>
            <button
              onClick={() => setActiveTab('teacher')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'teacher'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Award className="w-4 h-4 text-emerald-700" />
              <span>{lang === 'ru' ? 'Награды учителя' : 'Мугалимдин сыйлыктары'}</span>
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>{lang === 'ru' ? 'Успехи учеников' : 'Окуучулардын жеңиштери'}</span>
            </button>
          </div>
        </div>

        {/* Grid of achievements */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((item) => {
            const isStudent = item.category === 'students';
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group hover:border-emerald-600"
              >
                <div>
                  {item.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setSelectedAward(item)}
                      className="block w-full -mt-2 mb-4 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 cursor-pointer"
                      aria-label={lang === 'ru' ? 'Открыть фото' : 'Сүрөттү ачуу'}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title[lang]}
                        loading="lazy"
                        className="w-full aspect-[4/3] object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    </button>
                  )}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isStudent
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isStudent ? (
                        <Trophy className="w-5 h-5" />
                      ) : (
                        <Medal className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-stone-100 text-stone-700 rounded-md">
                      {item.year} г.
                    </span>
                  </div>

                  <span
                    className={`inline-block text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full mb-2 ${
                      isStudent
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {item.badge[lang]}
                  </span>

                  <h3 className="font-serif text-lg font-bold text-stone-900 mb-2 leading-snug">
                    {item.title[lang]}
                  </h3>

                  <p className="text-xs font-medium text-stone-500 mb-3 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{item.issuer[lang]}</span>
                  </p>

                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
                    {item.description[lang]}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs text-stone-400 font-medium">
                    {lang === 'ru' ? 'Документ верифицирован' : 'Документ тастыкталган'}
                  </span>
                  <button
                    onClick={() => setSelectedAward(item)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-900 py-1.5 px-2.5 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{lang === 'ru' ? 'Сертификат' : 'Күбөлүк'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Certificate Modal */}
        {selectedAward && (
          <div
            className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setSelectedAward(null)}
          >
            <div className="bg-stone-50 w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl border-4 border-amber-200 p-8 relative text-center">
              <button
                onClick={() => setSelectedAward(null)}
                className="absolute top-4 right-4 p-2 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Photo of the award or certificate, when the teacher uploaded one */}
              {selectedAward.imageUrl ? (
                <img
                  src={selectedAward.imageUrl}
                  alt={selectedAward.title[lang]}
                  className="w-full max-h-[55vh] object-contain rounded-xl border border-stone-200 bg-white mb-5"
                />
              ) : (
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-lg ring-4 ring-amber-100">
                  <Medal className="w-8 h-8" />
                </div>
              )}

              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                {selectedAward.issuer[lang]}
              </span>

              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-4 mb-2">
                {selectedAward.title[lang]}
              </h3>

              <div className="w-24 h-1 bg-amber-400 mx-auto my-4 rounded-full" />

              <p className="text-stone-700 text-sm sm:text-base leading-relaxed px-4 mb-6">
                {selectedAward.description[lang]}
              </p>

              <div className="bg-white p-4 rounded-xl border border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium max-w-md mx-auto mb-6">
                <div>
                  <span className="block text-stone-400 text-[10px] uppercase">
                    {lang === 'ru' ? 'Год вручения' : 'Берилген жылы'}
                  </span>
                  <span className="font-bold text-stone-900">{selectedAward.year} г.</span>
                </div>
                <div>
                  <span className="block text-stone-400 text-[10px] uppercase">
                    {lang === 'ru' ? 'Регион' : 'Аймак'}
                  </span>
                  <span className="font-bold text-stone-900">г. Ош, Кыргызстан</span>
                </div>
                <div>
                  <span className="block text-stone-400 text-[10px] uppercase">
                    {lang === 'ru' ? 'Статус' : 'Статусу'}
                  </span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Оригинал
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedAward(null)}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
              >
                {lang === 'ru' ? 'Закрыть сертификат' : 'Жабуу'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
