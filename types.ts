
export type Role = 'user' | 'pro';

export interface Card {
  id: string;
  number: string;
  brand: string;
  expiry: string;
}

export interface User {
  id: string;
  name: string;
  lastName: string;
  dni: string;
  photo: string;
  role: Role;
  email: string;
  cards: Card[];
  location?: {
    lat: number;
    lng: number;
  };
}

export interface Professional {
  id: string;
  name: string;
  category: string;
  rating: number;
  isPremium: boolean;
  location: string;
  bio: string;
  photo: string;
  reviewsCount: number;
  pricePerHour: number;
  earnings?: number;
  completedJobs?: number;
}

export interface Task {
  id: string;
  userId: string;
  userName: string;
  proId?: string;
  category: string;
  description: string;
  photo?: string;
  status: 'pending' | 'accepted' | 'completed' | 'paid';
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  participants: [string, string]; // [userId, proId]
  messages: Message[];
  lastMessage?: string;
}

export interface AppState {
  currentUser: User | null;
  tasks: Task[];
  chats: Chat[];
  professionals: Professional[];
  notifications: string[];
  isProMode: boolean;
}
