
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, Task, Chat, Professional, AppState, Role, Message, Card, InAppNotification, Transaction, Review } from '../types';
import { supabase } from '../services/supabase';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

interface AppContextType {
  state: AppState;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: Role, name: string, dni: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  toggleProMode: () => void;
  createTask: (category: string, description: string, photo?: string, location?: { lat: number, lng: number }, budget?: number) => Promise<void>;
  applyToTask: (taskId: string) => Promise<void>;
  addCard: (card: Omit<Card, 'id'>) => void;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  getChatForPro: (proId: string) => Promise<Chat>;
  fetchNotifications: () => Promise<void>;
  createPaymentPreference: (taskId: string, amount: number, description: string) => Promise<string>;
  finalizeTask: (taskId: string) => Promise<void>;
  resolveDispute: (disputeId: string, resolution: 'pro' | 'user') => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchReviews: (userId?: string) => Promise<void>;
  rateProfessional: (taskId: string, proId: string, rating: number, comment: string) => Promise<void>;
  rateUser: (taskId: string, userId: string, rating: number, comment: string) => Promise<void>;
  markNotificationsAsRead: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  checkAccountStatus: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    tasks: [],
    chats: [],
    professionals: [],
    profiles: [],
    notifications: [],
    transactions: [],
    reviews: [],
    isProMode: false,
    isInitialized: false
  });

  const profileFetchPromise = useRef<Promise<User | null> | null>(null);

  const safeDate = (dateStr: any) => {
    if (!dateStr) return new Date().toISOString();
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  };

  const fetchProfessionals = async () => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'pro');
      if (data) {
        const pros: Professional[] = data.map(p => ({
          id: p.id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Profesional',
          category: p.category || 'General',
          rating: p.completed_jobs > 0 ? (p.rating || 0) : 0,
          isPremium: p.is_premium || false,
          location: p.location, // Fix: Use real location from DB
          bio: p.bio || '',
          photo: p.photo || 'https://picsum.photos/seed/pro/200',
          reviewsCount: p.reviews_count || 0,
          pricePerHour: p.price_per_hour || 0,
          earnings: p.earnings || 0,
          completedJobs: p.completed_jobs || 0
        }));
        setState(prev => ({ ...prev, professionals: pros }));
      }
    } catch (e) {
      console.error("Error fetching professionals:", e);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          creator:profiles!tasks_user_id_fkey(first_name, last_name, photo),
          pro:profiles!tasks_pro_id_fkey(first_name, last_name, photo),
          reviews(*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const tasks: Task[] = data.map(t => {
          const creator = t.creator as any;
          const proProfile = t.pro as any;
          return {
            id: t.id,
            userId: t.user_id,
            userName: creator ? `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || 'Usuario' : 'Usuario',
            userLastName: '',
            proId: t.pro_id,
            proName: proProfile ? `${proProfile.first_name || ''} ${proProfile.last_name || ''}`.trim() || 'Profesional' : 'Profesional',
            proLastName: '',
            category: t.category,
            description: t.description,
            photo: t.photo,
            location: t.location,
            status: t.status,
            createdAt: t.created_at,
            reviews: t.reviews || []
          };
        });
        setState(prev => ({ ...prev, tasks }));
      }
    } catch (e) {
      console.error("General error in fetchTasks:", e);
    }
  };

  const fetchTransactions = async () => {
    if (!state.currentUser) return;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`user_id.eq.${state.currentUser.id},pro_id.eq.${state.currentUser.id}`)
        .order('created_at', { ascending: false });
      if (!error && data) {
        const transactions: Transaction[] = data.map(t => ({
          id: t.id,
          taskId: t.task_id,
          userId: t.user_id,
          proId: t.pro_id,
          amount: t.amount,
          feeAmount: t.fee_amount || 0,
          netAmount: t.net_amount || 0,
          type: t.type,
          status: t.status,
          createdAt: t.created_at
        }));
        setState(prev => ({ ...prev, transactions }));
      }
    } catch (e) {
      console.error("Error fetching transactions:", e);
    }
  };

  const fetchReviews = async (userId?: string) => {
    const targetId = userId || state.currentUser?.id;
    if (!targetId) return;
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewed_id', targetId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        const reviews: Review[] = data.map(r => ({
          id: r.id,
          taskId: r.task_id,
          reviewerId: r.reviewer_id,
          reviewedId: r.reviewed_id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.created_at
        }));
        setState(prev => ({ ...prev, reviews }));
      }
    } catch (e) {
      console.error("Error fetching reviews:", e);
    }
  };

  const fetchChats = async () => {
    if (!state.currentUser) return;
    try {
      const { data: chatData, error } = await supabase
        .from('chats')
        .select(`*, messages(*)`)
        .contains('participants', [state.currentUser.id]);

      if (!error && chatData) {
        const chats: Chat[] = chatData.map(c => ({
          id: c.id,
          participants: c.participants,
          messages: c.messages.map((m: any) => ({
            id: m.id,
            senderId: m.sender_id,
            text: m.text,
            timestamp: safeDate(m.timestamp || m.inserted_at)
          })).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        }));
        setState(prev => ({ ...prev, chats }));

        const allParticipantIds = Array.from(new Set(chats.flatMap(c => c.participants)));
        const missingIds = allParticipantIds.filter(id => id !== state.currentUser?.id);

        if (missingIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, photo, role, category, rating, is_premium, bio, reviews_count, price_per_hour, earnings, completed_jobs')
            .in('id', missingIds);

          if (profilesData) {
            const profiles = profilesData as any[];
            const users: User[] = profiles.map(p => ({
              id: p.id,
              name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Usuario',
              lastName: '',
              dni: p.dni || '',
              photo: p.photo || 'https://picsum.photos/seed/user/200',
              role: (p.role as Role) || 'user',
              email: p.email || '',
              cards: [],
              location: p.location,
              pushToken: p.push_token
            }));

            setState(prev => {
              const newProfiles = [...prev.profiles];
              users.forEach(u => {
                const existingIndex = newProfiles.findIndex(p => p.id === u.id);
                if (existingIndex === -1) newProfiles.push(u);
                else newProfiles[existingIndex] = u;
              });

              const fetchedPros = profiles.filter(p => p.role === 'pro').map(p => ({
                id: p.id,
                name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Profesional',
                category: p.category || 'General',
                rating: p.completed_jobs > 0 ? (p.rating || 0) : 0,
                isPremium: p.is_premium || false,
                location: p.location, // Fix: Use real location from DB
                bio: p.bio || '',
                photo: p.photo || 'https://picsum.photos/seed/pro/200',
                reviewsCount: p.reviews_count || 0,
                pricePerHour: p.price_per_hour || 0,
                earnings: p.earnings || 0,
                completedJobs: p.completed_jobs || 0
              }));

              const newPros = [...prev.professionals];
              fetchedPros.forEach(fp => {
                const existingIndex = newPros.findIndex(p => p.id === fp.id);
                if (existingIndex === -1) newPros.push(fp);
                else newPros[existingIndex] = fp;
              });

              return { ...prev, profiles: newProfiles, professionals: newPros };
            });
          }
        }
      }
    } catch (e) {
      console.error("Error fetching chats:", e);
    }
  };

  const fetchNotifications = async () => {
    if (!state.currentUser) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', state.currentUser.id)
        .order('created_at', { ascending: false });
      if (data) {
        const notifications: InAppNotification[] = data.map(n => ({
          id: n.id,
          userId: n.user_id,
          title: n.title,
          message: n.message,
          read: n.read,
          createdAt: n.created_at
        }));
        setState(prev => ({ ...prev, notifications }));
      }
    } catch (e) {
      console.error("[AppContext] fetchNotifications error:", e);
    }
  };

  const markNotificationsAsRead = async () => {
    if (!state.currentUser) return;
    try {
      await supabase.from('notifications').update({ read: true }).eq('user_id', state.currentUser.id);
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, read: true }))
      }));
    } catch (e) {
      console.error("Error marking notifications as read:", e);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      }));
    } catch (e) {
      console.error("Error marking notification as read:", e);
    }
  };

  const fetchProfileInternal = async (userId: string): Promise<User | null> => {
    const safetyTimeout = setTimeout(() => {
      setState(prev => prev.isInitialized ? prev : { ...prev, isInitialized: true });
    }, 8000);
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!error && data) {
        return {
          id: data.id,
          name: data.first_name || '',
          lastName: data.last_name || '',
          dni: data.dni || '',
          photo: data.photo || 'https://picsum.photos/seed/user/200',
          role: (data.role as Role) || 'user',
          email: data.email || '',
          cards: [],
          location: data.location,
          pushToken: data.push_token
        };
      }
    } catch (err) {
      console.error("Profile exception:", err);
    } finally {
      clearTimeout(safetyTimeout);
    }
    return null;
  };

  const fetchProfile = async (userId: string): Promise<User | null> => {
    if (profileFetchPromise.current) return profileFetchPromise.current;
    profileFetchPromise.current = fetchProfileInternal(userId);
    const user = await profileFetchPromise.current;
    profileFetchPromise.current = null;
    if (user) {
      setState(prev => ({ ...prev, currentUser: user, isProMode: user.role === 'pro', isInitialized: true }));
    } else {
      setState(prev => ({ ...prev, isInitialized: true }));
    }
    return user;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchProfile(session.user.id);
      else setState(prev => ({ ...prev, isInitialized: true }));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) fetchProfile(session.user.id);
      else if (event === 'SIGNED_OUT') {
        setState(prev => ({ ...prev, currentUser: null, tasks: [], chats: [], isInitialized: true }));
      }
    });
    fetchProfessionals();
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (state.currentUser) {
      fetchTasks();
      fetchChats();
      fetchNotifications();
      checkAccountStatus();
      if (Capacitor.isNativePlatform()) registerPushNotifications();
    }
  }, [state.currentUser?.id]);

  useEffect(() => {
    if (!state.currentUser) return;
    const chatSub = supabase.channel('chat_updates').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => setTimeout(() => fetchChats(), 500)).subscribe();
    const taskSub = supabase.channel('task_updates').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, () => fetchTasks()).subscribe();
    const notifSub = supabase.channel('notification_updates').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${state.currentUser.id}` }, () => fetchNotifications()).subscribe();
    return () => {
      supabase.removeChannel(chatSub);
      supabase.removeChannel(taskSub);
      supabase.removeChannel(notifSub);
    };
  }, [state.currentUser?.id]);

  const registerPushNotifications = async () => {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') permStatus = await PushNotifications.requestPermissions();
    if (permStatus.receive !== 'granted') return;
    await PushNotifications.addListener('registration', (token) => savePushToken(token.value));
    await PushNotifications.register();
  };

  const savePushToken = async (token: string) => {
    if (!state.currentUser) return;
    const { error } = await supabase.from('profiles').update({ push_token: token }).eq('id', state.currentUser.id);
    if (!error) setState(prev => ({ ...prev, currentUser: { ...prev.currentUser!, pushToken: token } }));
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session?.user) await fetchProfile(data.session.user.id);
  };

  const register = async (email: string, password: string, role: Role, name: string, dni: string) => {
    const { error, data } = await supabase.auth.signUp({ email, password, options: { data: { role, name, dni } } });
    if (error) throw error;
    if (data.session?.user) {
      await new Promise(r => setTimeout(r, 1500));
      const user = await fetchProfile(data.session.user.id);
      if (!user) {
        await supabase.from('profiles').insert({ id: data.session.user.id, email: data.session.user.email, first_name: name, dni: dni, role: role });
        await fetchProfile(data.session.user.id);
      }
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setState(prev => ({ ...prev, currentUser: null, tasks: [], chats: [], isProMode: false }));
  };

  const toggleProMode = () => setState(prev => ({ ...prev, isProMode: !prev.isProMode }));

  const updateUser = async (data: Partial<User>) => {
    if (!state.currentUser) return;
    const updates: any = {};
    if (data.name) updates.first_name = data.name;
    if (data.lastName) updates.last_name = data.lastName;
    if (data.dni) updates.dni = data.dni;
    if (data.photo) updates.photo = data.photo;
    if (data.cbuAlias) updates.cbu_alias = data.cbuAlias;
    if (data.criminalRecordUrl) updates.criminal_record_url = data.criminalRecordUrl;
    if (data.profession) updates.profession = data.profession;
    const { error } = await supabase.from('profiles').update(updates).eq('id', state.currentUser.id);
    if (!error) setState(prev => ({ ...prev, currentUser: { ...prev.currentUser!, ...data } }));
  };

  const addCard = (cardData: Omit<Card, 'id'>) => {
    if (!state.currentUser) return;
    const newCard: Card = { ...cardData, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({ ...prev, currentUser: { ...prev.currentUser!, cards: [...prev.currentUser!.cards, newCard] } }));
  };

  const createTask = async (category: string, description: string, photo?: string, location?: { lat: number, lng: number }, budget?: number) => {
    if (!state.currentUser) return;
    try {
      const { error } = await supabase.from('tasks').insert({ user_id: state.currentUser.id, category, description, photo, location, budget, status: 'pending' });
      if (error) throw error;
      await fetchTasks();
    } catch (e) {
      console.error("Error creating task:", e);
      throw e;
    }
  };

  const applyToTask = async (taskId: string) => {
    if (!state.currentUser) return;
    try {
      const { data: task } = await supabase.from('tasks').select('user_id, category').eq('id', taskId).single();
      const { error } = await supabase.from('tasks').update({ pro_id: state.currentUser.id, status: 'accepted' }).eq('id', taskId);
      if (error) throw error;

      if (task) {
        await supabase.from('notifications').insert({
          user_id: task.user_id,
          title: "¡Profesional asignado!",
          message: `Un profesional se ha postulado para tu tarea de ${task.category}.`
        });
      }

      await fetchTasks();
    } catch (e) {
      console.error("Error applying to task:", e);
      throw e;
    }
  };

  const getChatForPro = async (proId: string): Promise<Chat> => {
    if (!state.currentUser) throw new Error("Auth required");
    const existingChat = state.chats.find(c => c.participants.includes(state.currentUser!.id) && c.participants.includes(proId));
    if (existingChat) return existingChat;
    const { data, error } = await supabase.from('chats').insert({ participants: [state.currentUser.id, proId] }).select().single();
    if (error) throw error;
    const newChat: Chat = { id: data.id, participants: data.participants, messages: [] };
    setState(prev => ({ ...prev, chats: [...prev.chats, newChat] }));
    return newChat;
  };

  const sendMessage = async (chatId: string, text: string) => {
    if (!state.currentUser) return;
    const { error } = await supabase.from('messages').insert({ chat_id: chatId, sender_id: state.currentUser.id, text });
    if (!error) fetchChats();
  };

  const createPaymentPreference = async (taskId: string, amount: number, description: string): Promise<string> => {
    if (!state.currentUser) throw new Error("Auth required");
    const totalAmount = amount + (amount * 0.05);
    const { data, error } = await supabase.functions.invoke('mercadopago-payment', { body: { taskId, amount: totalAmount, description: `${description} (Incluye Costo de Protección y Garantía)`, userEmail: state.currentUser.email, isEscrow: true } });
    if (error || !data?.init_point) throw new Error("Error de pago.");
    return data.init_point;
  };

  const finalizeTask = async (taskId: string) => {
    try {
      const { data: task } = await supabase.from('tasks').select('pro_id, category').eq('id', taskId).single();
      const { error } = await supabase.from('tasks').update({ status: 'completed' }).eq('id', taskId);
      if (error) throw error;

      if (task && task.pro_id) {
        await supabase.from('notifications').insert({
          user_id: task.pro_id,
          title: "¡Trabajo Finalizado!",
          message: `El cliente ha finalizado la tarea de ${task.category}. El pago se liberará pronto.`
        });
      }

      await fetchTasks();
    } catch (e) {
      console.error("Error finalizing task:", e);
      throw e;
    }
  };

  const resolveDispute = async (disputeId: string, resolution: 'pro' | 'user') => {
    await supabase.from('disputes').update({ status: `resolved_${resolution}`, resolved_at: new Date().toISOString() }).eq('id', disputeId);
  };

  const checkAccountStatus = async () => {
    if (!state.currentUser || state.currentUser.role !== 'pro') return;
    const { data: profile } = await supabase.from('profiles').select('current_balance, dispute_count, last_debt_date').eq('id', state.currentUser.id).single();
    if (profile) {
      let shouldSuspend = profile.dispute_count >= 2;
      const daysWithDebt = profile.last_debt_date ? (Number(new Date()) - Number(new Date(profile.last_debt_date))) / (1000 * 60 * 60 * 24) : 0;
      if (profile.current_balance < 0 && daysWithDebt > 30) shouldSuspend = true;
      if (shouldSuspend) {
        await supabase.from('profiles').update({ is_suspended: true }).eq('id', state.currentUser.id);
        setState(prev => ({ ...prev, currentUser: { ...prev.currentUser!, isSuspended: true } }));
      }
    }
  };

  const rateProfessional = async (taskId: string, proId: string, rating: number, comment: string) => {
    if (!state.currentUser) return;
    try {
      const { error: revError } = await supabase.from('reviews').insert({ task_id: taskId, reviewer_id: state.currentUser.id, reviewed_id: proId, rating, comment });
      if (revError) throw revError;

      await supabase.from('notifications').insert({ user_id: proId, title: "¡Nueva Reseña!", message: `Has recibido un rating de ${rating} estrellas.` });

      const { data: reviews } = await supabase.from('reviews').select('rating').eq('reviewed_id', proId);
      if (reviews && reviews.length > 0) {
        const newRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
        await supabase.from('profiles').update({ rating: newRating, reviews_count: reviews.length }).eq('id', proId);
      }
      await fetchTasks(); // Refresh to hide button
      await fetchReviews(proId); // Refresh public view if needed
    } catch (e) {
      console.error("Error rating professional:", e);
      throw e;
    }
  };

  const rateUser = async (taskId: string, userId: string, rating: number, comment: string) => {
    if (!state.currentUser) return;
    try {
      const { error: revError } = await supabase.from('reviews').insert({ task_id: taskId, reviewer_id: state.currentUser.id, reviewed_id: userId, rating, comment });
      if (revError) throw revError;

      await supabase.from('notifications').insert({ user_id: userId, title: "¡PRO te calificó!", message: `El profesional te ha calificado con ${rating} estrellas.` });

      const { data: reviews } = await supabase.from('reviews').select('rating').eq('reviewed_id', userId);
      if (reviews && reviews.length > 0) {
        const newRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
        await supabase.from('profiles').update({ rating: newRating, reviews_count: reviews.length }).eq('id', userId);
      }
      await fetchTasks(); // Refresh to hide button
      await fetchReviews(userId); // Refresh public view if needed
    } catch (e) {
      console.error("Error rating user:", e);
      throw e;
    }
  };

  return (
    <AppContext.Provider value={{
      state, login, register, logout, updateUser, toggleProMode,
      createTask, applyToTask, sendMessage, getChatForPro, fetchNotifications,
      createPaymentPreference, finalizeTask, resolveDispute, checkAccountStatus,
      fetchTransactions, rateProfessional, fetchReviews, rateUser,
      markNotificationsAsRead, markNotificationAsRead
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

export default AppContext;
