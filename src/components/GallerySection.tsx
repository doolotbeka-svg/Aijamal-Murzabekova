import React, { useState } from 'react';
import { Language, GalleryItem } from '../types';
import { galleryItems } from '../data/content';
import { Camera, Calendar, Maximize2, X, Sparkles } from 'lucide-react';

interface GallerySectionProps {
  lang: Language;
}

export const GallerySection: React.FC<GallerySectionProps> = ({ lang }) => {
  const [activeTag, setActiveTag] = useState<string>('all');
  const [lightboxImage, setLightboxImage] = useState<GalleryItem | null>(null);

  const tags = [
    { id: 'all', label: lang === 'ru' ? 'Все фотографии' : 'Бардык сүрөттөр' },
    { id: 'alippe', label: lang === 'ru' ? 'Алиппе майрамы' : 'Алиппе майрамы' },
    { id: 'nooruz', label: lang === 'ru' ? 'Нооруз' : 'Нооруз' },
    { id: 'lessons', label: lang === 'ru' ? 'Уроки и 1 Сентября' : 'Сабактар жана 1-Сентябрь' },
    { id: 'nature', label: lang === 'ru' ? 'Сулайман-Тоо' : 'Сулайман-Тоо' },
    { id: 'crafts', label: lang === 'ru' ? 'Творчество' : 'Чыгармачылык' },
  ];

  const filteredItems =
    activeTag === 'all'
      ? galleryItems
      : galleryItems.filter((item) => item.tag === activeTag);

  return (
    <section id="gallery" className="py-20 bg-stone-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            {lang === 'ru' ? 'Школьные мгновения' : 'Мектеп көз ирмемдери'}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-3 mb-4">
            {lang === 'ru' ? 'Галерея школьной жизни нашего класса' : 'Биздин класстын мектеп турмушунун галереясы'}
          </h2>
          <p className="text-stone-600 text-base leading-relaxed">
            {lang === 'ru'
              ? 'Теплые кадры с открытых уроков, традиционного праздника Алиппе майрамы, весеннего Нооруза и экскурсий по родному Ошу.'
              : 'Ачык сабактардын, салтанаттуу Алиппе майрамынын, Нооруздун жана Сулайман-Тоого жасалган саякаттардын жылуу сүрөттөрү.'}
          </p>
        </div>

        {/* Filter tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {tags.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTag(t.id)}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTag === t.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Photo Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setLightboxImage(item)}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 border border-stone-200/80 cursor-pointer flex flex-col"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-stone-200">
                <img
                  src={item.imageUrl}
                  alt={item.title[lang]}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-stone-950/20 group-hover:bg-stone-950/40 transition-colors" />

                <div className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-4 h-4" />
                </div>

                <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-amber-300" />
                  <span>{item.date}</span>
                </div>
              </div>

              <div className="p-5 text-left flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base sm:text-lg group-hover:text-emerald-800 transition-colors">
                    {item.title[lang]}
                  </h3>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    {item.description[lang]}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span className="text-emerald-800 font-semibold">Школа-гимназия №4, г. Ош</span>
                  <span>Нажмите для увеличения</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-stone-900 text-white max-w-4xl w-full rounded-2xl overflow-hidden shadow-2xl relative"
            >
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative aspect-video max-h-[60vh] bg-black">
                <img
                  src={lightboxImage.imageUrl}
                  alt={lightboxImage.title[lang]}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-6 bg-stone-900 text-left">
                <div className="flex items-center gap-2 text-xs text-amber-400 font-medium mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{lightboxImage.date}</span>
                  <span>•</span>
                  <span>Школа-гимназия №4, г. Ош</span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mb-2">
                  {lightboxImage.title[lang]}
                </h3>
                <p className="text-stone-300 text-sm leading-relaxed">
                  {lightboxImage.description[lang]}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
