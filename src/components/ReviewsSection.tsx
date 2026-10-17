import React, { useState, useEffect } from 'react';
import { Language, Review } from '../types';
import { Star, MessageSquarePlus, CheckCircle2, X, AlertCircle } from 'lucide-react';

const AVATAR_COLORS = ['bg-emerald-600', 'bg-amber-600', 'bg-sky-600', 'bg-indigo-600', 'bg-rose-600', 'bg-teal-600'];

function avatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface ReviewsSectionProps {
  lang: Language;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ lang }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [newAuthor, setNewAuthor] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newText, setNewText] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [submittedMessage, setSubmittedMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/reviews')
      .then((res) => (res.ok ? res.json() : { reviews: [] }))
      .then((data) => setReviews(data.reviews || []))
      .catch(() => {});
  }, []);

  const closeModal = () => {
    setShowAddReviewModal(false);
    setSubmittedMessage(false);
    setError('');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAuthor.trim().length < 2 || newText.trim().length < 10) {
      setError(
        lang === 'ru'
          ? 'Укажите имя и напишите отзыв хотя бы в одно предложение.'
          : 'Атыңызды жана жок дегенде бир сүйлөм пикир жазыңыз.'
      );
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: newAuthor, role: newRole, text: newText, rating: newRating }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSubmittedMessage(true);
      setNewAuthor('');
      setNewRole('');
      setNewText('');
      setNewRating(5);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="py-20 bg-stone-50 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 text-left">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
              {lang === 'ru' ? 'Теплота и доверие' : 'Жылуулук жана ишеним'}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-3 mb-3">
              {lang === 'ru' ? 'Слова благодарности родителей и коллег' : 'Ата-энелердин жана кесиптештердин ыраазычылыгы'}
            </h2>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              {lang === 'ru'
                ? 'Искренние отзывы семей выпускников и руководства гимназии о первых шагах детей в школьной жизни.'
                : 'Бүтүрүүчүлөрдүн ата-энелеринин жана мектеп жетекчилигинин мугалимдин мээнетине берген баасы.'}
            </p>
          </div>

          <button
            onClick={() => setShowAddReviewModal(true)}
            className="self-start md:self-auto flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200/80 rounded-xl transition-colors cursor-pointer border border-emerald-300"
          >
            <MessageSquarePlus className="w-4 h-4 text-emerald-800" />
            <span>{lang === 'ru' ? 'Оставить свой отзыв' : 'Пикир калтыруу'}</span>
          </button>
        </div>

        {/* Reviews Grid */}
        {reviews.length === 0 && (
          <div className="bg-white p-10 rounded-2xl border border-dashed border-stone-300 text-center text-stone-500 text-sm">
            {lang === 'ru'
              ? 'Отзывов пока нет — будьте первым, кто поделится впечатлениями!'
              : 'Азырынча пикир жок — биринчи болуп оюңузду бөлүшүңүз!'}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-7 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors text-left"
            >
              <div>
                {/* Rating stars */}
                <div className="flex items-center gap-1 mb-4 text-amber-500">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="font-serif italic text-stone-800 text-sm sm:text-base leading-relaxed mb-6">
                  «{rev.text}»
                </p>
              </div>

              {/* Author Footer */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${avatarColor(rev.author)} text-white font-bold text-sm flex items-center justify-center shrink-0`}
                  >
                    {rev.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-stone-900 text-sm">
                      {rev.author}
                    </h4>
                    {rev.role && <p className="text-xs text-stone-500">{rev.role}</p>}
                  </div>
                </div>

                <span className="text-[11px] text-stone-400 font-medium">
                  {new Date(rev.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'ky-KG', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Add Review */}
        {showAddReviewModal && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 p-6 sm:p-8 relative text-left">
              <button
                onClick={closeModal}
                aria-label={lang === 'ru' ? 'Закрыть' : 'Жабуу'}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">
                {lang === 'ru' ? 'Оставить отзыв о педагоге' : 'Мугалимге пикир калтыруу'}
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm mb-6">
                {lang === 'ru'
                  ? 'Поделитесь впечатлениями об обучении вашего ребёнка или совместной работе.'
                  : 'Балаңыздын окуусу же кесиптештик кызматташуу боюнча оюңузду бөлүшүңүз.'}
              </p>

              {submittedMessage ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <p className="font-serif text-lg font-bold text-stone-900">
                    {lang === 'ru' ? 'Спасибо за тёплые слова!' : 'Жылуу пикириңизге чоң рахмат!'}
                  </p>
                  <p className="text-stone-500 text-xs">
                    {lang === 'ru'
                      ? 'Отзыв появится на сайте после проверки учителем.'
                      : 'Пикириңиз мугалим текшергенден кийин сайтта жарыяланат.'}
                  </p>
                  <button
                    onClick={closeModal}
                    className="mt-3 px-5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
                  >
                    {lang === 'ru' ? 'Закрыть' : 'Жабуу'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {lang === 'ru' ? 'Ваше имя и фамилия' : 'Аты-жөнүңүз'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder={lang === 'ru' ? 'Например: Айзада Муратова' : 'Мисалы: Айзада Муратова'}
                      className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {lang === 'ru' ? 'Кто вы?' : 'Сиз ким болосуз?'}
                    </label>
                    <input
                      type="text"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      placeholder={
                        lang === 'ru'
                          ? 'Мама первоклассника / Коллега-учитель'
                          : '1-класстын окуучусунун энеси / Кесиптеш'
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {lang === 'ru' ? 'Оценка' : 'Баалоо'}
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setNewRating(star)}
                          className="p-1 cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= newRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-stone-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {lang === 'ru' ? 'Ваш отзыв' : 'Пикириңиз'} *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={newText}
                      maxLength={1500}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder={
                        lang === 'ru'
                          ? 'Напишите несколько добрых слов об уроках, заботе учителя и школьной жизни...'
                          : 'Мугалимдин сабактары, камкордугу жана мектеп жашоосу тууралуу жылуу сөздөрүңүздү жазыңыз...'
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  {error && (
                    <p role="alert" className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </p>
                  )}

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                    >
                      {lang === 'ru' ? 'Отмена' : 'Жокко чыгаруу'}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-xl shadow-xs"
                    >
                      {isSubmitting
                        ? lang === 'ru' ? 'Отправка…' : 'Жөнөтүлүүдө…'
                        : lang === 'ru' ? 'Отправить отзыв' : 'Жөнөтүү'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
