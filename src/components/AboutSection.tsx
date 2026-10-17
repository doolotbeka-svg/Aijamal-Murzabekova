import React from 'react';
import { Language } from '../types';
import { useContent } from '../ContentContext';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  BookOpen,
  Brain,
  Smile,
  Compass,
  FileCheck,
} from 'lucide-react';

interface AboutSectionProps {
  lang: Language;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ lang }) => {
  const { teacherProfile } = useContent();
  return (
    <section id="about" className="py-20 bg-stone-50 border-t border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full">
            {lang === 'ru' ? 'Профессиональный профиль' : 'Кесиптик профиль'}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-3 mb-4">
            {lang === 'ru' ? 'О педагоге и педагогическом подходе' : 'Мугалим жана педагогикалык багыт жөнүндө'}
          </h2>
          <p className="text-stone-600 text-base leading-relaxed">
            {lang === 'ru'
              ? 'Фундаментальное педагогическое образование, постоянное самосовершенствование и трепетная любовь к каждому ученику, переступающему порог школы в древнем городе Ош.'
              : 'ОшМУнун педагогикалык пайдубалы, үзгүлтүксүз кесиптик өсүү жана мектеп босогосун аттаган ар бир наристеге болгон ыйык камкордук.'}
          </p>
        </div>

        {/* Education & Qualifications Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          {/* Education Block */}
          <div className="bg-white p-7 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  {lang === 'ru' ? 'Базовое образование' : 'Базалык билим'}
                </h3>
              </div>

              <div className="space-y-6">
                {teacherProfile.education.map((edu, idx) => (
                  <div key={idx} className="relative pl-6 border-l-2 border-emerald-600/40 pb-2">
                    <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-emerald-700 ring-4 ring-emerald-100" />
                    <h4 className="font-semibold text-stone-900 text-base">
                      {edu.institution[lang]}
                    </h4>
                    <p className="text-stone-600 text-sm mt-1 leading-relaxed">
                      {edu.degree[lang]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quote of respect */}
            <div className="mt-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200/60 text-xs text-amber-950 font-medium">
              {lang === 'ru'
                ? '«Учитель начальных классов — это зодчий фундамента человеческой личности. Ошибки здесь недопустимы». — ОшМУ, 2008 г.'
                : '«Башталгыч класстын мугалими — адамдын кулк-мүнөзүнүн жана келечегинин алгачкы устаты». — ОшМУ, 2008-ж.'}
            </div>
          </div>

          {/* Professional Development / Courses */}
          <div className="bg-white p-7 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  {lang === 'ru' ? 'Повышение квалификации и сертификация' : 'Квалификацияны жогорулатуу жана сертификаттар'}
                </h3>
              </div>

              <div className="space-y-4">
                {teacherProfile.qualifications.map((qual, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-stone-50 hover:bg-emerald-50/40 border border-stone-200/70 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-stone-800 text-sm">
                          {qual.title[lang]}
                        </h4>
                        <p className="text-xs text-stone-500 mt-1">
                          {qual.issuer[lang]}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                        {qual.year}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-stone-500">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              <span>
                {lang === 'ru'
                  ? 'Все документы подтверждены аттестационной комиссией МОиН КР'
                  : 'Бардык документтер КР Билим берүү министрлигинин аттестациясынан өткөн'}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Pillars of Pedagogical Approach */}
        <div className="mt-12">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
              {lang === 'ru' ? 'Ключевые методики' : 'Башкы усулдар'}
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-2">
              {lang === 'ru' ? '4 принципа моей педагогической системы' : 'Менин педагогикалык тутумумдун 4 негизи'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teacherProfile.approachPillars.map((pillar, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-stone-200 hover:border-emerald-600 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-serif text-3xl font-bold text-emerald-800/80 group-hover:text-emerald-700 transition-colors">
                      {pillar.number}
                    </span>
                    <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                      {pillar.tag[lang]}
                    </span>
                  </div>
                  <h4 className="font-serif text-lg font-bold text-stone-900 mb-2">
                    {pillar.title[lang]}
                  </h4>
                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                    {pillar.description[lang]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
