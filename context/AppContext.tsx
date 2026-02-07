
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Task, Chat, Professional, AppState, Role, Message, Card } from '../types';
import { supabase } from '../services/supabase';

interface AppContextType {
  state: AppState;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: Role, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  toggleProMode: () => void;
  createTask: (category: string, description: string, photo?: string) => Promise<void>;
  applyToTask: (taskId: string) => Promise<void>;
  addCard: (card: Omit<Card, 'id'>) => void;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  getChatForPro: (proId: string) => Promise<Chat>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    tasks: [],
    chats: [],
    professionals: [],
    notifications: [],
    isProMode: false
  });

  // Load initial data and subscriptions
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Optimistically set current user if we have session, but profile fetch is needed for details
        // We rely on fetchProfile to update full state
        await fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setState(prev => ({ ...prev, currentUser: null, tasks: [], chats: [] }));
      }
    });

    // Load public data (Pros) - simplified for now
    fetchProfessionals();

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user data when logged in
  useEffect(() => {
    if (state.currentUser) {
      fetchTasks();
      fetchChats();
    }
  }, [state.currentUser?.id]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      // Map DB profile to User type
      const user: User = {
        id: data.id,
        name: data.first_name || '',
        lastName: data.last_name || '',
        dni: data.dni || '',
        photo: data.photo || 'https://picsum.photos/seed/user/200',
        role: data.role as Role,
        email: data.email || '',
        cards: [], // Cards not persisted in this demo
        location: data.location
      };
      setState(prev => ({ ...prev, currentUser: user, isProMode: user.role === 'pro' }));
    }
  };

  const fetchProfessionals = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'pro');

    if (data) {
      const pros: Professional[] = data.map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name || ''}`.trim(),
        category: p.category || 'General',
        rating: p.rating || 5.0,
        isPremium: p.is_premium || false,
        location: 'Ubicación Pro', // Placeholder or from location json
        bio: p.bio || '',
        photo: p.photo || 'https://picsum.photos/seed/pro/200',
        reviewsCount: p.reviews_count || 0,
        pricePerHour: p.price_per_hour || 0,
        earnings: p.earnings || 0,
        completedJobs: p.completed_jobs || 0
      }));
      setState(prev => ({ ...prev, professionals: pros }));
    }
  };

  const fetchTasks = async () => {
    // Fetch tasks where user is creator OR user is the assigned Pro
    // For simplicity, just fetching all tasks for now or implemented filtering
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const tasks: Task[] = await Promise.all(data.map(async t => {
        // Fetch creator name (inefficient n+1 but works for now)
        const { data: userData } = await supabase.from('profiles').select('first_name').eq('id', t.user_id).single();
        return {
          id: t.id,
          userId: t.user_id,
          userName: userData?.first_name || 'Usuario',
          proId: t.pro_id,
          category: t.category,
          description: t.description,
          photo: t.photo,
          status: t.status,
          createdAt: t.created_at
        };
      }));
      setState(prev => ({ ...prev, tasks }));
    }
  };

  const fetchChats = async () => {
    if (!state.currentUser) return;
    const { data: chatData } = await supabase
      .from('chats')
      .select('*, messages(*)')
      .contains('participants', [state.currentUser.id]);

    if (chatData) {
      const chats: Chat[] = chatData.map(c => ({
        id: c.id,
        participants: c.participants,
        messages: c.messages.map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          text: m.text,
          timestamp: m.created_at
        })).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      }));
      setState(prev => ({ ...prev, chats }));
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Explicitly fetch profile to ensure state updates immediately before redirect
    if (data.session?.user) {
      await fetchProfile(data.session.user.id);
    }
  };

  const register = async (email: string, password: string, role: Role, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          name // Handled by trigger to create profile
        }
      }
    });
    if (error) throw error;

    // Check if session exists (auto-login often happens on sign up in Supabase dev)
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setState(prev => ({ ...prev, currentUser: null, isProMode: false }));
  };

  const toggleProMode = () => {
    setState(prev => ({ ...prev, isProMode: !prev.isProMode }));
  };

  const updateUser = async (data: Partial<User>) => {
    if (!state.currentUser) return;

    const updates: any = {};
    if (data.name) updates.first_name = data.name;
    if (data.lastName) updates.last_name = data.lastName;

    // Update Supabase
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', state.currentUser.id);

    if (!error) {
      setState(prev => ({
        ...prev,
        currentUser: { ...prev.currentUser!, ...data }
      }));
    }
  };

  const addCard = (cardData: Omit<Card, 'id'>) => {
    // Local memory only for demo
    if (!state.currentUser) return;
    const newCard: Card = { ...cardData, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({
      ...prev,
      currentUser: {
        ...prev.currentUser!,
        cards: [...prev.currentUser!.cards, newCard]
      }
    }));
  };

  const createTask = async (category: string, description: string, photo?: string) => {
    if (!state.currentUser) return;

    const { error } = await supabase.from('tasks').insert({
      user_id: state.currentUser.id,
      category,
      description,
      photo,
      status: 'pending'
    });

    if (!error) fetchTasks();
  };

  const applyToTask = async (taskId: string) => {
    if (!state.currentUser) return;
    const { error } = await supabase
      .from('tasks')
      .update({ pro_id: state.currentUser.id, status: 'accepted' })
      .eq('id', taskId);

    if (!error) fetchTasks();
  };

  const getChatForPro = async (proId: string): Promise<Chat> => {
    if (!state.currentUser) throw new Error("Auth required");

    // Check local state first (or could fetch)
    const existingChat = state.chats.find(c =>
      c.participants.includes(state.currentUser!.id) && c.participants.includes(proId)
    );
    if (existingChat) return existingChat;

    // Create new chat
    const { data, error } = await supabase
      .from('chats')
      .insert({
        participants: [state.currentUser.id, proId]
      })
      .select()
      .single();

    if (error) throw error;

    const newChat: Chat = {
      id: data.id,
      participants: data.participants,
      messages: []
    };

    setState(prev => ({ ...prev, chats: [...prev.chats, newChat] }));
    return newChat;
  };

  const sendMessage = async (chatId: string, text: string) => {
    if (!state.currentUser) return;

    const { error } = await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: state.currentUser.id,
      text
    });

    if (!error) fetchChats(); // Refresh messages
  };

  return (
    <AppContext.Provider value={{
      state, login, register, logout, updateUser, toggleProMode,
      createTask, applyToTask, addCard, sendMessage, getChatForPro
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
