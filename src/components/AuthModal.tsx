import React, { useState } from 'react';
import { Language, UserProfile } from '../types';
import {
  X,
  User,
  ShieldCheck,
  Send,
  MessageCircle,
  Phone,
  Check,
} from 'lucide-react';

interface AuthModalProps {
  lang: Language;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  lang,
  onClose,
  onLoginSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<'parent' | 'colleague' | 'commission'>('parent');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [activeTab, setActiveTab] = useState<'social' | 'phone'>('social');
  const [phoneStep, setPhoneStep] = useState<'input' | 'code'>('input');
  const [smsCode, setSmsCode] = useState('');

  const handleSocialLogin = (provider: 'google' | 'telegram' | 'whatsapp') => {
    const dummyUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name:
        name.trim() ||
        (provider === 'google'
          ? 'Айсулуу Токтогулова'
          : provider === 'telegram'
          ? 'Нурбек_Ош'
          : 'Асылбек Эрматов'),
      emailOrPhone:
        provider === 'google'
          ? 'aisuluu.parent@gmail.com'
          : provider === 'telegram'
          ? '@nurbek_osh'
          : '+996 555 88-12-34',
      provider,
      role: selectedRole,
    };
    onLoginSuccess(dummyUser);
    onClose();
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneStep === 'input') {
      setPhoneStep('code');
    } else {
      const dummyUser: UserProfile = {
        id: `usr-${Date.now()}`,
        name: name.trim() || 'Пользователь из Оша',
        emailOrPhone: contact.trim() || '+996 777 00-11-22',
        provider: 'phone',
        role: selectedRole,
      };
      onLoginSuccess(dummyUser);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 p-6 sm:p-8 relative text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-800 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="w-11 h-11 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center mb-3">
            <User className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-stone-900">
            {lang === 'ru' ? 'Вход в личный кабинет' : 'Жеке кабинетке кирүү'}
          </h3>
          <p className="text-stone-600 text-xs mt-1">
            {lang === 'ru'
              ? 'Авторизуйтесь в 1 клик для доступа к персональным материалам и расписанию.'
              : 'Жеке материалдарга жана графике кирүү үчүн 1 басуу менен катталыңыз.'}
          </p>
        </div>

        {/* Role Selector */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            {lang === 'ru' ? 'Выберите вашу роль:' : 'Өз ролуңузду тандаңыз:'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'parent', label: lang === 'ru' ? 'Родитель' : 'Ата-эне' },
              { id: 'colleague', label: lang === 'ru' ? 'Учитель' : 'Мугалим' },
              { id: 'commission', label: lang === 'ru' ? 'Комиссия' : 'Комиссия' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r.id as any)}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-colors cursor-pointer ${
                  selectedRole === r.id
                    ? 'bg-emerald-800 text-white border-emerald-800'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab switch between Social and Phone */}
        <div className="flex border-b border-stone-200 mb-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('social')}
            className={`pb-2 mr-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'social'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {lang === 'ru' ? 'Через социальные сети' : 'Соцтармактар аркылуу'}
          </button>
          <button
            onClick={() => setActiveTab('phone')}
            className={`pb-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'phone'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {lang === 'ru' ? 'По номеру телефона' : 'Телефон номери менен'}
          </button>
        </div>

        {activeTab === 'social' ? (
          <div className="space-y-3">
            {/* Google */}
            <button
              onClick={() => handleSocialLogin('google')}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{lang === 'ru' ? 'Войти через Google' : 'Google аркылуу кирүү'}</span>
            </button>

            {/* Telegram */}
            <button
              onClick={() => handleSocialLogin('telegram')}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{lang === 'ru' ? 'Войти через Telegram' : 'Telegram аркылуу кирүү'}</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => handleSocialLogin('whatsapp')}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{lang === 'ru' ? 'Войти через WhatsApp' : 'WhatsApp аркылуу кирүү'}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handlePhoneSubmit} className="space-y-3">
            {phoneStep === 'input' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {lang === 'ru' ? 'Номер телефона' : 'Телефон номери'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="+996 770 00-00-00"
                    className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-colors cursor-pointer"
                >
                  {lang === 'ru' ? 'Получить SMS-код' : 'SMS-код алуу'}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {lang === 'ru' ? 'Введите 4-значный SMS-код (демо: 1234)' : 'SMS-кодду жазыңыз (демо: 1234)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    placeholder="1234"
                    maxLength={4}
                    className="w-full px-3.5 py-2.5 text-center tracking-widest text-lg font-bold bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-colors cursor-pointer"
                >
                  {lang === 'ru' ? 'Подтвердить и войти' : 'Ырастоо жана кирүү'}
                </button>
              </>
            )}
          </form>
        )}

        <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>
            {lang === 'ru'
              ? 'Безопасная авторизация • Персональные данные защищены'
              : 'Коопсуз авторизация • Маалыматтар корголгон'}
          </span>
        </div>
      </div>
    </div>
  );
};
