import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import { useContent } from '../ContentContext';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  GraduationCap,
  Minimize2,
  RefreshCw,
} from 'lucide-react';

interface AiChatbotProps {
  lang: Language;
  isOpen: boolean;
  onToggle: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AiChatbot: React.FC<AiChatbotProps> = ({ lang, isOpen, onToggle }) => {
  const { schoolContactDetails, teacherProfile } = useContent();
  // The greeting is rendered from the current language, so it follows the RU/KG switch
  const greeting: Message = {
    id: 'init-1',
    sender: 'assistant',
    text:
      lang === 'ru'
        ? `Здравствуйте! Я ИИ-помощник учителя начальных классов ${teacherProfile.fullName.ru} (г. Ош). Отвечу на вопросы о подготовке к 1 классу, методиках обучения или помогу записаться на консультацию. Чем могу помочь?`
        : `Саламатсызбы! Мен башталгыч класс мугалими ${teacherProfile.fullName.kg} эженин виртуалдык жардамчысымын. 1-класска кабыл алуу, баланы мектепке даярдоо же ачык сабактар боюнча суроолоруңузга жооп берүүгө даярмын!`,
    timestamp: '',
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = [
    {
      ru: 'Как подготовить ребёнка к 1 классу в Оше?',
      kg: 'Баланы 1-класска кантип туура даярдоо керек?',
    },
    {
      ru: 'В чём суть ваших методик сингапурской математики?',
      kg: 'Сингапур математикасынын өзгөчөлүгү эмнеде?',
    },
    {
      ru: 'Как проходит праздник «Алиппе майрамы»?',
      kg: '«Алиппе майрамы» кандай форматта өтөт?',
    },
    {
      ru: 'Как записаться на личную консультацию?',
      kg: 'Жеке консультацияга кантип жазылсам болот?',
    },
  ];

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText.trim(),
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          lang,
          history: messages.map(({ sender, text }) => ({ sender, text })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const assistantMsg: Message = {
        id: `msg-resp-${Date.now()}`,
        sender: 'assistant',
        text:
          data.reply ||
          (lang === 'ru'
            ? `Спасибо за ваш вопрос! ${teacherProfile.shortName.ru} с радостью обсудит это на личной встрече.`
            : `Сурооңузга чоң рахмат! ${teacherProfile.shortName.kg} бул тууралуу жеке баарлашууда кеңири айтып берет.`),
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'assistant',
          text:
            lang === 'ru'
              ? `Не удалось получить ответ. Вы всегда можете связаться с учителем через WhatsApp: ${schoolContactDetails.phoneDisplay}.`
              : `Жооп алынган жок. Мугалим менен WhatsApp аркылуу түздөн-түз байланышсаңыз болот: ${schoolContactDetails.phoneDisplay}.`,
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer border border-amber-300/40"
          aria-label="ИИ-Помощник"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" style={{ animationDuration: '8s' }} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-900" />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-wide">
            {lang === 'ru' ? 'ИИ-Консультант' : 'ИИ-Жардамчы'}
          </span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 sm:w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col h-[520px] max-h-[85vh]">
          {/* Top Chat Header */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-300 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h4 className="font-serif font-bold text-sm">
                    {lang === 'ru' ? 'Ассистент Айжамал эже (AI)' : 'Айжамал эже жардамчысы (AI)'}
                  </h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[11px] text-stone-300">
                  {lang === 'ru'
                    ? 'Педагогическая консультация • Школа №4, г. Ош'
                    : 'Педагогикалык кеңеш • №4 мектеп, Ош ш.'}
                </p>
              </div>
            </div>

            <button
              onClick={onToggle}
              aria-label={lang === 'ru' ? 'Закрыть чат' : 'Чатты жабуу'}
              className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-50/60 text-left text-xs sm:text-sm">
            {[greeting, ...messages].map((m) => {
              const isAssistant = m.sender === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${
                    isAssistant ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-full bg-emerald-800 text-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                      isAssistant
                        ? 'bg-white text-stone-800 border border-stone-200/90 shadow-xs'
                        : 'bg-emerald-800 text-white rounded-br-none shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>
                    {m.timestamp && (
                      <span
                        className={`block text-[10px] mt-1 text-right ${
                          isAssistant ? 'text-stone-400' : 'text-emerald-200'
                        }`}
                      >
                        {m.timestamp}
                      </span>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="w-7 h-7 rounded-full bg-stone-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-stone-500 text-xs py-2 pl-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <span>
                  {lang === 'ru'
                    ? 'Ассистент формулирует ответ...'
                    : 'Жардамчы жооп даярдоодо...'}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Chips */}
          <div className="px-3 py-2 bg-stone-100 border-t border-stone-200 overflow-x-auto flex gap-1.5 scrollbar-none">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q[lang])}
                className="shrink-0 text-[11px] font-medium px-2.5 py-1 bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 border border-stone-200 hover:border-emerald-300 rounded-full transition-colors cursor-pointer"
              >
                {q[lang]}
              </button>
            ))}
          </div>

          {/* Chat Input Field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="p-3 bg-white border-t border-stone-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              maxLength={1000}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                lang === 'ru'
                  ? 'Задайте вопрос о школе, приёме, уроках...'
                  : 'Мектеп, сабактар боюнча суроо жазыңыз...'
              }
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
            <button
              type="submit"
              aria-label={lang === 'ru' ? 'Отправить' : 'Жөнөтүү'}
              disabled={isLoading || !input.trim()}
              className="p-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
