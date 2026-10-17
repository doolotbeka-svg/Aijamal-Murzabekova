export type Language = 'ru' | 'kg';

export interface MethodMaterial {
  id: string;
  title: { ru: string; kg: string };
  category: 'lesson' | 'game' | 'event' | 'parent';
  grade: string;
  subject: { ru: string; kg: string };
  duration: string;
  description: { ru: string; kg: string };
  fileType: 'PDF' | 'DOCX' | 'PPTX';
  fileSize: string;
  downloadCount: number;
  highlight?: boolean;
  contentPreview: {
    goals: { ru: string; kg: string };
    equipment: { ru: string; kg: string };
    stages: Array<{ title: { ru: string; kg: string }; text: { ru: string; kg: string } }>;
  };
}

export interface Achievement {
  id: string;
  title: { ru: string; kg: string };
  issuer: { ru: string; kg: string };
  year: string;
  level: 'republican' | 'city' | 'school' | 'international';
  category: 'teacher' | 'students';
  badge: { ru: string; kg: string };
  description: { ru: string; kg: string };
  imageUrl?: string;
}

export interface GalleryItem {
  id: string;
  title: { ru: string; kg: string };
  tag: 'alippe' | 'nooruz' | 'lessons' | 'nature' | 'crafts';
  date: string;
  imageUrl: string;
  description: { ru: string; kg: string };
}

export interface Review {
  id: string;
  author: string;
  role: { ru: string; kg: string };
  rating: number;
  text: { ru: string; kg: string };
  date: string;
  avatarBg: string;
}

export interface ApplicationRecord {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  studentAgeOrGrade: string;
  preferredMessenger: 'WhatsApp' | 'Telegram' | 'Phone';
  comment: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'consulted' | 'enrolled';
  channelNotificationSent: {
    telegram: boolean;
    whatsapp: boolean;
    timestamp: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  emailOrPhone: string;
  provider: 'google' | 'telegram' | 'whatsapp' | 'phone';
  role: 'parent' | 'colleague' | 'commission' | 'guest';
  avatar?: string;
}
