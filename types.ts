
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
  pushToken?: string;
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
  userLastName?: string;
  proId?: string;
  proName?: string;
  proLastName?: string;
  category: string;
  description: string;
  photo?: string;
  location?: {
    lat: number;
    lng: number;
  };
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

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AppState {
  currentUser: User | null;
  tasks: Task[];
  chats: Chat[];
  professionals: Professional[];
  profiles: User[];
  notifications: InAppNotification[];
  isProMode: boolean;
  isInitialized: boolean;
}
