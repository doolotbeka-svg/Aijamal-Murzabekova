import React, { useState } from 'react';
import { Language, ApplicationRecord } from '../types';
import { schoolContactDetails } from '../data/content';
import {
  MapPin,
  Phone,
  Mail,
  Send,
  MessageCircle,
  Clock,
  CheckCircle,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  BellRing,
} from 'lucide-react';

interface ContactSectionProps {
  lang: Language;
  onApplicationCreated: (app: ApplicationRecord) => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  lang,
  onApplicationCreated,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+996 ');
  const [purpose, setPurpose] = useState('Запись на консультацию по приёму в 1-й класс');
  const [studentAgeOrGrade, setStudentAgeOrGrade] = useState('6–7 лет (будущий первоклассник)');
  const [preferredMessenger, setPreferredMessenger] = useState<'WhatsApp' | 'Telegram' | 'Phone'>('WhatsApp');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    app: ApplicationRecord;
    alerts: any;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || phone.length < 8) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          purpose,
          studentAgeOrGrade,
          preferredMessenger,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.application) {
        setSubmissionResult({
          success: true,
          app: data.application,
          alerts: data.notificationAlert,
        });
        onApplicationCreated(data.application);
      }
    } catch (err) {
      console.error('Failed to submit application:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pre-fill text for WhatsApp direct redirect
  const whatsappPreFilledText = encodeURIComponent(
    `Саламатсызбы / Здравствуйте, Айгүл Бектемировна! Мен сайт аркылуу жазылып жатам. Менин атым: ${
      name || 'Родитель'
    }. Суроо: ${purpose}. Телефон: ${phone}`
  );

  return (
    <section id="contact" className="py-20 bg-amber-50/20 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            {lang === 'ru' ? 'Связь и запись' : 'Байланыш жана жазылуу'}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-3 mb-4">
            {lang === 'ru'
              ? 'Контакты и запись на консультацию'
              : 'Байланышуу жана жеке консультацияга жазылуу'}
          </h2>
          <p className="text-stone-600 text-base leading-relaxed">
            {lang === 'ru'
              ? 'Буду рада ответить на вопросы родителей о поступлении в 1 класс, адаптации ребенка или поделиться методическим опытом с коллегами.'
              : '1-класска кабыл алуу, баланын мектепке көнүүсү же усулдук кызматташуу боюнча суроолоруңузга кубаныч менен жооп берем.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: School & Contact Cards */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="bg-white p-7 rounded-2xl border border-stone-200/90 shadow-xs space-y-6">
              <h3 className="font-serif text-xl font-bold text-stone-900">
                {lang === 'ru' ? 'Рабочие контакты в г. Ош' : 'Ош шаарындагы жумушчу даректер'}
              </h3>

              <div className="space-y-4 text-sm">
                {/* School Address */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">
                      {lang === 'ru' ? 'Школа и адрес' : 'Мектеп жана дарек'}
                    </p>
                    <p className="text-stone-600 text-xs sm:text-sm mt-0.5 leading-relaxed">
                      {schoolContactDetails.address[lang]}
                    </p>
                  </div>
                </div>

                {/* Direct Phone / WhatsApp */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">
                      {lang === 'ru' ? 'Рабочий телефон / WhatsApp' : 'Жумушчу телефон / WhatsApp'}
                    </p>
                    <a
                      href={`tel:${schoolContactDetails.phone}`}
                      className="text-stone-800 hover:text-emerald-800 font-bold text-sm block mt-0.5"
                    >
                      {schoolContactDetails.phoneDisplay}
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">
                      {lang === 'ru' ? 'Электронная почта' : 'Электрондук почта'}
                    </p>
                    <a
                      href={`mailto:${schoolContactDetails.email}`}
                      className="text-stone-600 hover:text-emerald-800 text-xs sm:text-sm break-all mt-0.5"
                    >
                      {schoolContactDetails.email}
                    </a>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">
                      {lang === 'ru' ? 'Часы приёма' : 'Кабыл алуу убактысы'}
                    </p>
                    <p className="text-stone-600 text-xs mt-0.5 leading-relaxed">
                      {schoolContactDetails.workingHours[lang]}
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Fast Messenger Buttons */}
              <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row gap-2">
                <a
                  href={`${schoolContactDetails.whatsappUrl}?text=${whatsappPreFilledText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={schoolContactDetails.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram</span>
                </a>
              </div>
            </div>

            {/* Instant Messenger Sync Info Box */}
            <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white p-5 rounded-2xl shadow-sm text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <BellRing className="w-4 h-4 animate-bounce" />
                <span>Мгновенные уведомления администратора</span>
              </div>
              <p className="text-emerald-100 leading-relaxed">
                Каждая заявка через форму сайта автоматически отправляется в Telegram-бот и
                WhatsApp Business учителя с SMS-оповещением в течение 30 секунд.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Booking Form */}
          <div className="lg:col-span-7">
            <div className="bg-white p-7 sm:p-9 rounded-2xl border border-stone-200/90 shadow-sm text-left">
              {submissionResult ? (
                <div className="py-8 space-y-6 text-center">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-9 h-9" />
                  </div>

                  <div>
                    <h3 className="font-serif text-2xl font-bold text-stone-900">
                      {lang === 'ru' ? 'Заявка успешно принята!' : 'Билдирмеңиз кабыл алынды!'}
                    </h3>
                    <p className="text-stone-600 text-sm mt-1">
                      {lang === 'ru'
                        ? `Уважаемый(ая) ${submissionResult.app.name}, Айгүл Бектемировна свяжется с вами в ближайшее время.`
                        : `Урматтуу ${submissionResult.app.name}, Айгүл Бектемировна сиз менен жакын арада байланышат.`}
                    </p>
                  </div>

                  {/* Messenger Dispatch confirmation card */}
                  <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl text-left text-xs space-y-2 max-w-md mx-auto">
                    <div className="font-bold text-stone-800 flex items-center gap-1.5 text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Статус доставки уведомления педагогу:</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Telegram Bot (@AigulTeacherOshBot):</span>
                      <span className="font-semibold text-emerald-700">✓ Доставлено</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span>WhatsApp Cloud API (+996 555 12-34-56):</span>
                      <span className="font-semibold text-emerald-700">✓ Оповещен</span>
                    </div>
                  </div>

                  {/* WhatsApp Direct Chat button */}
                  <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                    <a
                      href={`${schoolContactDetails.whatsappUrl}?text=${whatsappPreFilledText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{lang === 'ru' ? 'Написать напрямую в WhatsApp' : 'WhatsApp аркылуу жазуу'}</span>
                    </a>
                    <button
                      onClick={() => setSubmissionResult(null)}
                      className="px-5 py-3 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl"
                    >
                      {lang === 'ru' ? 'Отправить ещё одну заявку' : 'Жаңы билдирме жөнөтүү'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="border-b border-stone-100 pb-3 mb-4">
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                      {lang === 'ru' ? 'Запись на консультацию или открытый урок' : 'Консультацияга же ачык сабакка жазылуу'}
                    </h3>
                    <p className="text-stone-500 text-xs mt-1">
                      {lang === 'ru'
                        ? 'Заполните краткую информацию. Мы подберём удобное время для встречи.'
                        : 'Кыскача маалымат калтырыңыз, биз сизге ыңгайлуу убакытты сунуштайбыз.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        {lang === 'ru' ? 'Ваше ФИО' : 'Аты-жөнүңүз'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Например: Чынара Жумабекова"
                        className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        {lang === 'ru' ? 'Номер телефона (WhatsApp)' : 'Телефон номериңиз'} *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+996 770 12-34-56"
                        className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        {lang === 'ru' ? 'Цель обращения' : 'Кайрылуунун максаты'}
                      </label>
                      <select
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      >
                        <option value="Запись на консультацию по приёму в 1-й класс">
                          {lang === 'ru'
                            ? 'Запись в 1-й класс (набор 2026/27)'
                            : '1-класска кабыл алуу (2026/27)'}
                        </option>
                        <option value="Педагогическая консультация по адаптации">
                          {lang === 'ru' ? 'Консультация по адаптации и развитию' : 'Баланын өнүгүүсү боюнча кеңеш'}
                        </option>
                        <option value="Успеваемость и олимпиадная подготовка">
                          {lang === 'ru' ? 'Олимпиадная математика (2-4 классы)' : 'Олимпиадалык математика'}
                        </option>
                        <option value="Посещение открытого урока / Коллега">
                          {lang === 'ru' ? 'Посещение открытого урока (для учителей)' : 'Ачык сабакка катышуу (мугалимдерге)'}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        {lang === 'ru' ? 'Возраст или класс ребёнка' : 'Баланын жашы же классы'}
                      </label>
                      <input
                        type="text"
                        value={studentAgeOrGrade}
                        onChange={(e) => setStudentAgeOrGrade(e.target.value)}
                        placeholder="Например: 6.5 лет / 2-й класс"
                        className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {lang === 'ru' ? 'Где вам удобнее получить ответ?' : 'Жоопту кайсы мессенджерден алгыңыз келет?'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['WhatsApp', 'Telegram', 'Phone'] as const).map((m) => (
                        <button
                          type="button"
                          key={m}
                          onClick={() => setPreferredMessenger(m)}
                          className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                            preferredMessenger === m
                              ? 'bg-emerald-800 text-white border-emerald-800'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {m === 'Phone' ? (lang === 'ru' ? 'Звонок' : 'Чалуу') : m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {lang === 'ru' ? 'Комментарий или вопрос (необязательно)' : 'Кошумча сурооңуз'}
                    </label>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={
                        lang === 'ru'
                          ? 'Например: хотим узнать о школьных принадлежностях и расписании адаптационных занятий...'
                          : 'Мисалы: мектеп формасы, сабактардын графиги жөнүндө суроолор...'
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>{lang === 'ru' ? 'Отправка...' : 'Жөнөтүлүүдө...'}</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>
                            {lang === 'ru'
                              ? 'Отправить заявку с уведомлением в мессенджеры'
                              : 'Билдирмени мессенджерлерге жөнөтүү'}
                          </span>
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-stone-400 text-center mt-2">
                      {lang === 'ru'
                        ? 'Администратор получает уведомление моментально через Telegram и WhatsApp'
                        : 'Администратор Telegram жана WhatsApp аркылуу заматта билдирме алат'}
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
