import React, { useState } from 'react';
import { Language, MethodMaterial } from '../types';
import { methodologicalMaterials } from '../data/content';
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  Clock,
  Layers,
  Sparkles,
  BookOpen,
  X,
  FileCheck2,
} from 'lucide-react';

interface MethodologySectionProps {
  lang: Language;
  onTrackDownload: (material: MethodMaterial) => void;
}

export const MethodologySection: React.FC<MethodologySectionProps> = ({
  lang,
  onTrackDownload,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<MethodMaterial | null>(null);
  const [downloadSuccessModal, setDownloadSuccessModal] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: lang === 'ru' ? 'Все материалы' : 'Бардык материалдар' },
    { id: 'lesson', label: lang === 'ru' ? 'Открытые уроки' : 'Ачык сабактар' },
    { id: 'game', label: lang === 'ru' ? 'Игры и квесты' : 'Оюндар жана квесттер' },
    { id: 'event', label: lang === 'ru' ? 'Мероприятия и праздники' : 'Иш-чаралар' },
    { id: 'parent', label: lang === 'ru' ? 'Родителям' : 'Ата-энелерге' },
  ];

  const filteredMaterials =
    activeCategory === 'all'
      ? methodologicalMaterials
      : methodologicalMaterials.filter((m) => m.category === activeCategory);

  const handleDownload = (material: MethodMaterial) => {
    onTrackDownload(material);
    setDownloadSuccessModal(material.title[lang]);
    setTimeout(() => {
      setDownloadSuccessModal(null);
    }, 4000);
  };

  return (
    <section id="methodology" className="py-20 bg-amber-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full">
            {lang === 'ru' ? 'Педагогическая копилка' : 'Усулдук сандык'}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-3 mb-4">
            {lang === 'ru' ? 'Методические разработки и конспекты уроков' : 'Усулдук иштеп чыгуулар жана сабактардын иштелмелери'}
          </h2>
          <p className="text-stone-600 text-base leading-relaxed">
            {lang === 'ru'
              ? 'Практические материалы, проверенные в классах города Ош: сценарии, презентации, дидактические игры и памятки для педагогов и родителей.'
              : 'Ош шаарынын мектептеринде ийгиликтүү колдонулган сабактардын конспектилери, дидактикалык оюндар жана ата-энелер үчүн методикалык эстеткичтер.'}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Notification Toast for simulated download */}
        {downloadSuccessModal && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md bg-stone-900 text-white p-4 rounded-xl shadow-xl flex items-start gap-3 border border-emerald-500/50 animate-bounce">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-sm text-emerald-300">
                {lang === 'ru' ? 'Файл успешно скачан!' : 'Файл ийгиликтүү жүктөлдү!'}
              </p>
              <p className="text-stone-300 mt-0.5">{downloadSuccessModal}</p>
              <p className="text-stone-400 text-[10px] mt-1">
                {lang === 'ru'
                  ? 'Событие зафиксировано в панели активности'
                  : 'Окуя көзөмөл панелине жазылды'}
              </p>
            </div>
            <button
              onClick={() => setDownloadSuccessModal(null)}
              className="text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Materials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((mat) => (
            <div
              key={mat.id}
              className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between p-6 shadow-xs hover:shadow-md ${
                mat.highlight
                  ? 'border-emerald-300 ring-1 ring-emerald-200/50'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div>
                {/* Header tags */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                    {mat.grade}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                    <span className="px-1.5 py-0.5 bg-stone-100 rounded text-[10px] font-bold text-stone-700">
                      {mat.fileType}
                    </span>
                    <span>{mat.fileSize}</span>
                  </div>
                </div>

                <h3 className="font-serif text-lg font-bold text-stone-900 mb-2 leading-snug">
                  {mat.title[lang]}
                </h3>

                <p className="text-xs font-semibold text-emerald-700 mb-3">
                  {mat.subject[lang]} • {mat.duration}
                </p>

                <p className="text-stone-600 text-xs sm:text-sm line-clamp-3 mb-4 leading-relaxed">
                  {mat.description[lang]}
                </p>
              </div>

              {/* Bottom buttons */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedMaterial(mat)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-emerald-800 transition-colors py-2 px-3 rounded-lg hover:bg-stone-50 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-stone-500" />
                  <span>{lang === 'ru' ? 'План урока' : 'Сабактын планы'}</span>
                </button>

                <button
                  onClick={() => handleDownload(mat)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 transition-colors py-2 px-3.5 rounded-lg shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === 'ru' ? 'Скачать' : 'Жүктөө'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Lesson Detailed Preview */}
        {selectedMaterial && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-900 to-teal-800 text-white p-6 relative">
                <button
                  onClick={() => setSelectedMaterial(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-amber-400 text-stone-900 rounded">
                    {selectedMaterial.grade}
                  </span>
                  <span className="text-xs text-emerald-200 font-medium">
                    {selectedMaterial.subject[lang]}
                  </span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold pr-8 leading-tight">
                  {selectedMaterial.title[lang]}
                </h3>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto text-left text-sm">
                <div>
                  <h4 className="font-semibold text-stone-900 flex items-center gap-2 text-sm uppercase tracking-wide text-emerald-800 mb-2">
                    <FileCheck2 className="w-4 h-4" />
                    <span>{lang === 'ru' ? 'Педагогические цели:' : 'Сабактын максаттары:'}</span>
                  </h4>
                  <p className="text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200 leading-relaxed">
                    {selectedMaterial.contentPreview.goals[lang]}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-stone-900 flex items-center gap-2 text-sm uppercase tracking-wide text-emerald-800 mb-2">
                    <Layers className="w-4 h-4" />
                    <span>{lang === 'ru' ? 'Оборудование и материалы:' : 'Керектүү жабдуулар:'}</span>
                  </h4>
                  <p className="text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200 leading-relaxed">
                    {selectedMaterial.contentPreview.equipment[lang]}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-stone-900 flex items-center gap-2 text-sm uppercase tracking-wide text-emerald-800 mb-3">
                    <Clock className="w-4 h-4" />
                    <span>{lang === 'ru' ? 'Ход урока и этапы:' : 'Сабактын жүрүшү жана этаптары:'}</span>
                  </h4>
                  <div className="space-y-3">
                    {selectedMaterial.contentPreview.stages.map((stage, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200/60"
                      >
                        <div className="font-semibold text-stone-900 text-xs sm:text-sm text-emerald-900">
                          {stage.title[lang]}
                        </div>
                        <p className="text-stone-600 text-xs mt-1 leading-relaxed">
                          {stage.text[lang]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-stone-500">
                  {lang === 'ru'
                    ? `Формат: ${selectedMaterial.fileType} (${selectedMaterial.fileSize})`
                    : `Форматы: ${selectedMaterial.fileType} (${selectedMaterial.fileSize})`}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedMaterial(null)}
                    className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                  >
                    {lang === 'ru' ? 'Закрыть' : 'Жабуу'}
                  </button>
                  <button
                    onClick={() => {
                      handleDownload(selectedMaterial);
                      setSelectedMaterial(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{lang === 'ru' ? 'Скачать полный материал' : 'Толук материалды жүктөө'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
