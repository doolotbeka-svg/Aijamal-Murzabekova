import React, { useState } from 'react';
import { Language } from '../types';
import { useContent } from '../ContentContext';
import {
  Award,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  GraduationCap,
  MessageCircle,
  FileText,
  HeartHandshake,
} from 'lucide-react';

interface HeroSectionProps {
  lang: Language;
  onOpenBooking: () => void;
  onOpenAchievements: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  lang,
  onOpenBooking,
  onOpenAchievements,
}) => {
  const { teacherProfile } = useContent();
  // Until a real photo is added to public/, show the teacher's initials instead
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const photoFailed = !teacherProfile.photoUrl || failedPhotoUrl === teacherProfile.photoUrl;

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-gradient-to-b from-amber-50/70 via-stone-50 to-emerald-50/30">
      {/* Decorative background glow */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-emerald-100/40 via-amber-100/50 to-teal-100/30 blur-3xl -z-10 rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Text & Credo & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Location & Status Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold tracking-wide bg-emerald-800 text-emerald-50 rounded-full shadow-xs">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <span>{teacherProfile.honor[lang]}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-amber-100 text-amber-900 border border-amber-300/80 rounded-full">
                <MapPin className="w-3.5 h-3.5 text-amber-700" />
                <span>{teacherProfile.city[lang]}</span>
              </span>
            </div>

            {/* Main Heading / Title */}
            <div>
              <p className="text-emerald-800 font-semibold text-sm sm:text-base tracking-wide uppercase mb-1">
                {teacherProfile.title[lang]}
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold text-stone-900 leading-tight">
                {teacherProfile.fullName[lang]}
              </h1>
              <p className="text-stone-600 font-medium text-base sm:text-lg mt-2">
                {teacherProfile.school[lang]}
              </p>
            </div>

            {/* Pedagogical Credo Block */}
            <div className="relative p-5 sm:p-6 bg-white/90 backdrop-blur-sm rounded-2xl border-l-4 border-emerald-700 shadow-sm border border-stone-200/80">
              <div className="text-stone-400 absolute top-3 right-4 font-serif text-4xl select-none opacity-40">
                “
              </div>
              <p className="font-serif italic text-base sm:text-lg text-stone-800 leading-relaxed">
                {teacherProfile.credo[lang]}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-stone-500 font-medium pt-2 border-t border-stone-100">
                <span>{lang === 'ru' ? 'Педагогическая миссия' : 'Педагогикалык миссия'}</span>
                <span className="text-emerald-800 font-semibold">{teacherProfile.credoAuthor[lang]}</span>
              </div>
            </div>

            {/* Action Buttons (CTAs) */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#contact"
                onClick={onOpenBooking}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 group"
              >
                <HeartHandshake className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform" />
                <span>{lang === 'ru' ? 'Связаться со мной / Запись' : 'Мага байланышуу / Жазылуу'}</span>
              </a>

              <a
                href="#achievements"
                onClick={onOpenAchievements}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm sm:text-base font-semibold text-stone-800 bg-white hover:bg-stone-50 border border-stone-300 hover:border-emerald-700 rounded-xl shadow-xs transition-all duration-200"
              >
                <Award className="w-4 h-4 text-emerald-700" />
                <span>{lang === 'ru' ? 'Посмотреть достижения' : 'Жетишкендиктерди көрүү'}</span>
              </a>

              <a
                href="#methodology"
                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium text-stone-600 hover:text-emerald-800 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>{lang === 'ru' ? 'Методическая копилка' : 'Усулдук сандык'}</span>
              </a>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-stone-200/90">
              <div className="p-3 bg-white/70 rounded-xl border border-stone-200/60">
                <div className="font-serif text-2xl font-bold text-emerald-900">{`${teacherProfile.experienceYears}+`}</div>
                <div className="text-xs text-stone-600 font-medium">
                  {lang === 'ru' ? 'лет стажа' : 'жылдык тажрыйба'}
                </div>
              </div>
              <div className="p-3 bg-white/70 rounded-xl border border-stone-200/60">
                <div className="font-serif text-2xl font-bold text-emerald-900">{`${teacherProfile.graduatesCount}+`}</div>
                <div className="text-xs text-stone-600 font-medium">
                  {lang === 'ru' ? 'выпускников' : 'бүтүрүүчү'}
                </div>
              </div>
              <div className="p-3 bg-white/70 rounded-xl border border-stone-200/60">
                <div className="font-serif text-2xl font-bold text-emerald-900">{teacherProfile.openLessonsCount}</div>
                <div className="text-xs text-stone-600 font-medium">
                  {lang === 'ru' ? 'открытых уроков' : 'ачык сабактар'}
                </div>
              </div>
              <div className="p-3 bg-white/70 rounded-xl border border-stone-200/60">
                <div className="font-serif text-2xl font-bold text-emerald-900">{teacherProfile.olympiadWinnersCount}</div>
                <div className="text-xs text-stone-600 font-medium">
                  {lang === 'ru' ? 'призёра олимпиад' : 'олимпиада жеңүүчүсү'}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Portrait Presentation */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Outer decorative ring */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-600 via-amber-500 to-teal-700 rounded-3xl opacity-20 blur-sm transform -rotate-1" />

              <div className="relative bg-white p-3 rounded-2xl shadow-xl border border-stone-200/80">
                {/* Photo container */}
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-stone-100">
                  {photoFailed ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-700 via-teal-800 to-amber-700 text-amber-50 font-serif text-7xl font-bold">
                      {teacherProfile.fullName[lang]
                        .split(' ')
                        .map((part) => part.charAt(0))
                        .join('')}
                    </div>
                  ) : (
                    <img
                      src={teacherProfile.photoUrl}
                      alt={teacherProfile.fullName[lang]}
                      className="w-full h-full object-cover object-center"
                      loading="eager"
                      onError={() => setFailedPhotoUrl(teacherProfile.photoUrl)}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />

                  {/* Badges on photo */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-stone-800 shadow-md flex items-center gap-1.5 border border-amber-200">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>{teacherProfile.photoBadge[lang]}</span>
                  </div>

                  {/* Caption on image */}
                  <div className="absolute bottom-3 left-3 right-3 text-white text-left p-3 rounded-lg bg-black/40 backdrop-blur-sm">
                    <p className="font-serif font-bold text-sm sm:text-base">
                      {teacherProfile.fullName[lang]}
                    </p>
                    <p className="text-xs text-amber-200 font-medium">
                      {teacherProfile.photoCaption[lang]}
                    </p>
                  </div>
                </div>

                {/* Micro trust chips below photo */}
                {teacherProfile.heroHighlights.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-left">
                    {teacherProfile.heroHighlights.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-xs ${
                          idx % 2 === 0 ? 'bg-amber-50/70 border-amber-100' : 'bg-emerald-50/70 border-emerald-100'
                        }`}
                      >
                        <div className={`font-semibold ${idx % 2 === 0 ? 'text-amber-900' : 'text-emerald-900'}`}>
                          {item.title[lang]}
                        </div>
                        <div className="text-stone-600 text-[11px]">{item.text[lang]}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
