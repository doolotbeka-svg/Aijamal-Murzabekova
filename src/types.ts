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

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  author: string;
  role: string;
  rating: number;
  text: string;
  createdAt: string;
  status: ReviewStatus;
}

export type ApplicationStatus = 'new' | 'contacted' | 'consulted' | 'enrolled' | 'archived';

export interface ApplicationRecord {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  studentAgeOrGrade: string;
  preferredMessenger: 'WhatsApp' | 'Telegram' | 'Phone';
  comment: string;
  createdAt: string;
  status: ApplicationStatus;
  adminNote: string;
  notification: {
    telegram: 'sent' | 'failed' | 'disabled';
    at: string;
  };
}

export interface ActivityEvent {
  id: string;
  type: 'download' | 'application' | 'review' | 'chat_query';
  title: string;
  details: string;
  createdAt: string;
}

export interface AdminStats {
  totalVisits: number;
  visitsToday: number;
  totalDownloads: number;
  totalChatQueries: number;
  totalApplications: number;
  newApplications: number;
  pendingReviews: number;
  last7Days: { date: string; visits: number }[];
  recentActivities: ActivityEvent[];
  integrations: { telegram: boolean; gemini: boolean; geminiModel: string; storage: 'blob' | 'local' | 'missing' };
}
