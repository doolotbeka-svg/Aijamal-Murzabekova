import React from 'react';
import { Language } from '../types';
import { BookOpen, Heart, MapPin, Phone, Mail, Award } from 'lucide-react';
import { useContent } from '../ContentContext';

interface FooterProps {
  lang: Language;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const { teacherProfile, schoolContactDetails } = useContent();
  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12 text-left">
          {/* Col 1: Teacher Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-amber-600 flex items-center justify-center text-white font-bold">
                <BookOpen className="w-5 h-5 text-amber-100" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-white text-base">
                  {teacherProfile.fullName[lang]}
                </h4>
                <p className="text-xs text-amber-300">
                  {lang === 'ru' ? 'Отличник образования КР' : 'КР Эл агартуунун отличниги'}
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              {lang === 'ru'
                ? 'Персональный сайт-портфолио учителя начальных классов. Создано для открытого диалога с родителями, обмена опытом с коллегами и подготовки будущих первоклассников.'
                : 'Башталгыч класс мугалиминин жеке портфолиосу. Ата-энелер менен ачык диалог жана кесиптештер менен тажрыйба алмашуу үчүн түзүлгөн.'}
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h5 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">
              {lang === 'ru' ? 'Навигация' : 'Бөлүмдөр'}
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#about" className="hover:text-emerald-400 transition-colors">
                  {lang === 'ru' ? 'О педагоге и методиках' : 'Мугалим жана усулдар'}
                </a>
              </li>
              <li>
                <a href="#methodology" className="hover:text-emerald-400 transition-colors">
                  {lang === 'ru' ? 'Методическая копилка' : 'Усулдук сандык'}
                </a>
              </li>
              <li>
                <a href="#achievements" className="hover:text-emerald-400 transition-colors">
                  {lang === 'ru' ? 'Достижения и олимпиады' : 'Жетишкендиктер жана олимпиадалар'}
                </a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-emerald-400 transition-colors">
                  {lang === 'ru' ? 'Галерея школьной жизни' : 'Мектеп турмушунун галереясы'}
                </a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-emerald-400 transition-colors">
                  {lang === 'ru' ? 'Отзывы родителей' : 'Ата-энелердин пикирлери'}
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: School Affiliation in Osh */}
          <div>
            <h5 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">
              {lang === 'ru' ? 'Образовательное учреждение' : 'Билим берүү мекемеси'}
            </h5>
            <p className="text-xs text-stone-400 leading-relaxed mb-3">
              {teacherProfile.school[lang]}
            </p>
            <div className="flex items-center gap-2 text-xs text-stone-400 mb-2">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{schoolContactDetails.address[lang]}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <a href={`tel:${schoolContactDetails.phone.replace(/[^+\d]/g, '')}`} className="hover:text-emerald-400 transition-colors">
                {schoolContactDetails.phoneDisplay}
              </a>
            </div>
          </div>

          {/* Col 4: Pedagogical Creed */}
          <div>
            <h5 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">
              {lang === 'ru' ? 'Педагогическое кредо' : 'Педагогикалык кредо'}
            </h5>
            <p className="font-serif italic text-xs text-amber-200/90 leading-relaxed bg-stone-800/80 p-3.5 rounded-xl border border-stone-700/60">
              «Жүрөгүмдү балдарга арнайм — Сердце отдаю детям. Учить с любовью, бережно раскрывая
              потенциал каждого ребёнка».
            </p>
            <p className="text-[11px] text-stone-500 mt-2">
              г. Ош • Кыргызстан
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} {teacherProfile.fullName[lang]}. {lang === 'ru' ? 'Все права защищены.' : 'Бардык укуктар корголгон.'}</p>
          <div className="flex items-center gap-1 text-stone-400">
            <span>{lang === 'ru' ? 'С любовью к детям древнего города Ош' : 'Байыркы Ош шаарынын балдарына болгон сүйүү менен'}</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
};
