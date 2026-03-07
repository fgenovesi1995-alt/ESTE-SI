import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, Task, Chat, Professional, AppState, Role, Message, Card } from '../types';
import { supabase } from '../services/supabase';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

interface AppContextType {
  state: AppState;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: Role, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  toggleProMode: () => void;
  createTask: (category: string, description: string, photo?: string, location?: { lat: number, lng: number }) => Promise<void>;
  applyToTask: (taskId: string) => Promise<void>;
  addCard: (card: Omit<Card, 'id'>) => void;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  getChatForPro: (proId: string) => Promise<Chat>;
  createPaymentPreference: (taskId: string, amount: number, description: string) => Promise<string>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    tasks: [],
    chats: [],
    professionals: [],
    notifications: [],
    isProMode: false,
    isInitialized: false
  });

  const profileFetchPromise = useRef<Promise<User | null> | null>(null);

  // --- Utility Functions ---

  const fetchProfessionals = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'pro');

      if (data) {
        const pros: Professional[] = data.map(p => ({
          id: p.id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Profesional',
          category: p.category || 'General',
          rating: p.rating || 5.0,
          isPremium: p.is_premium || false,
          location: 'Ubicación Pro',
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
      console.log("Refreshing tasks list...");
      const { data, error } = await supabase
        .from('tasks')
        .select('*, creator:profiles!tasks_user_id_fkey(first_name)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase fetchTasks error:", error.message);
        return;
      }

      if (data) {
        console.log(`Fetched ${data.length} tasks successfully.`);
        const tasks: Task[] = data.map(t => ({
          id: t.id,
          userId: t.user_id,
          userName: (t.creator as any)?.first_name || 'Usuario',
          proId: t.pro_id,
          category: t.category,
          description: t.description,
          photo: t.photo,
          location: t.location,
          status: t.status,
          createdAt: t.created_at
        }));
        setState(prev => ({ ...prev, tasks }));
      }
    } catch (e) {
      console.error("General error in fetchTasks:", e);
    }
  };

  const fetchChats = async () => {
    if (!state.currentUser) return;
    try {
      const { data: chatData, error } = await supabase
        .from('chats')
        .select('*, messages(*)')
        .contains('participants', [state.currentUser.id]);

      if (!error && chatData) {
        console.log(`[AppContext] Fetched ${chatData.length} chats successfully.`);
        const chats: Chat[] = chatData.map(c => ({
          id: c.id,
          participants: c.participants,
          messages: c.messages.map((m: any) => ({
            id: m.id,
            senderId: m.sender_id,
            text: m.text,
            timestamp: m.timestamp
          })).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        }));
        setState(prev => ({ ...prev, chats }));
      }
    } catch (e) {
      console.error("Error fetching chats:", e);
    }
  };

  // --- core Auth logic ---

  const fetchProfileInternal = async (userId: string): Promise<User | null> => {
    // Safety timeout to avoid hanging the app
    const safetyTimeout = setTimeout(() => {
      setState(prev => prev.isInitialized ? prev : { ...prev, isInitialized: true });
    }, 8000);

    try {
      console.log("Fetching profile from DB for UID:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Supabase profile error:", error.message);
        return null;
      }

      if (data) {
        console.log("Profile loaded successfully.");
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
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn("Profile fetch aborted (harmless).");
      } else {
        console.error("Profile exception:", err);
      }
    } finally {
      clearTimeout(safetyTimeout);
    }
    return null;
  };

  const fetchProfile = async (userId: string): Promise<User | null> => {
    // If we're already fetching, return the existing promise
    if (profileFetchPromise.current) {
      console.log("Re-using existing profile fetch promise...");
      return profileFetchPromise.current;
    }

    profileFetchPromise.current = fetchProfileInternal(userId);
    const user = await profileFetchPromise.current;
    profileFetchPromise.current = null; // Clear lock

    if (user) {
      setState(prev => ({
        ...prev,
        currentUser: user,
        isProMode: user.role === 'pro',
        isInitialized: true
      }));
    } else {
      // If we couldn't get the profile, we still need to unblock the UI
      setState(prev => ({ ...prev, isInitialized: true }));
    }

    return user;
  };

  // --- Auth Listeners ---

  useEffect(() => {
    console.log("Initializing App Context...");

    // 1. Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        console.log("Found existing session on boot.");
        fetchProfile(session.user.id);
      } else {
        console.log("No initial session found.");
        setState(prev => ({ ...prev, isInitialized: true }));
      }
    });

    // 2. Setup auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event fired:", event);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setState(prev => ({
          ...prev,
          currentUser: null,
          tasks: [],
          chats: [],
          isInitialized: true
        }));
      }
    });

    fetchProfessionals();
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (state.currentUser) {
      fetchTasks();
      fetchChats();

      // Register for push notifications if on native platform
      if (Capacitor.isNativePlatform()) {
        registerPushNotifications();
      }
    }
  }, [state.currentUser?.id]);

  useEffect(() => {
    if (!state.currentUser) return;

    console.log("[AppContext] Setting up real-time chat subscription...");
    const channel = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log("[AppContext] New message received via Realtime:", payload.new);
          // Small delay to ensure DB consistency across nodes before fetching
          setTimeout(() => fetchChats(), 500);
        }
      )
      .subscribe();

    return () => {
      console.log("[AppContext] Removing real-time chat subscription...");
      supabase.removeChannel(channel);
    };
  }, [state.currentUser?.id]);

  const registerPushNotifications = async () => {
    console.log("Starting push notification registration process...");
    let permStatus = await PushNotifications.checkPermissions();
    console.log("Current push permissions:", permStatus.receive);

    if (permStatus.receive === 'prompt') {
      console.log("Requesting push permissions...");
      permStatus = await PushNotifications.requestPermissions();
      console.log("New push permissions:", permStatus.receive);
    }

    if (permStatus.receive !== 'granted') {
      console.warn("User denied push notification permissions");
      return;
    }

    // Add listeners BEFORE registering
    console.log("Adding push listeners...");
    await PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token:', token.value);
      savePushToken(token.value);
    });

    await PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error.error);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
    });

    console.log("Calling PushNotifications.register()...");
    await PushNotifications.register();
  };

  const savePushToken = async (token: string) => {
    if (!state.currentUser) {
      console.warn("Cannot save push token: No currentUser found in state.");
      return;
    }
    console.log(`Updating push_token for user ${state.currentUser.id}...`);
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', state.currentUser.id);

    if (!error) {
      console.log("Push token saved successfully to Supabase.");
      setState(prev => ({
        ...prev,
        currentUser: { ...prev.currentUser!, pushToken: token }
      }));
    } else {
      console.error("FATAL ERROR saving push token to Supabase:", error.message, error.details);
    }
  };

  // --- Exposed Provider Methods ---

  const login = async (email: string, password: string) => {
    console.log("Attempting sign in...");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Login failed:", error.message);
      throw error;
    }

    if (data.session?.user) {
      console.log("Sign in success, waiting for profile...");
      await fetchProfile(data.session.user.id);
    }
  };

  const register = async (email: string, password: string, role: Role, name: string) => {
    const { error, data } = await supabase.auth.signUp({
      email, password, options: { data: { role, name } }
    });
    if (error) throw error;

    if (data.session?.user) {
      // Wait a bit for DB trigger
      await new Promise(r => setTimeout(r, 1500));
      const user = await fetchProfile(data.session.user.id);
      if (!user) {
        console.log("Trigger delayed, creating profile manually...");
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.session.user.id,
          email: data.session.user.email,
          first_name: name,
          role: role
        });
        if (!profileError) await fetchProfile(data.session.user.id);
      }
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setState(prev => ({
      ...prev,
      currentUser: null,
      tasks: [],
      chats: [],
      isProMode: false
    }));
  };

  const toggleProMode = () => {
    setState(prev => ({ ...prev, isProMode: !prev.isProMode }));
  };

  const updateUser = async (data: Partial<User>) => {
    if (!state.currentUser) return;
    const updates: any = {};
    if (data.name) updates.first_name = data.name;
    if (data.lastName) updates.last_name = data.lastName;

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

  const createTask = async (category: string, description: string, photo?: string, location?: { lat: number, lng: number }) => {
    if (!state.currentUser) return;
    const { error } = await supabase.from('tasks').insert({
      user_id: state.currentUser.id,
      category,
      description,
      photo,
      location,
      status: 'pending'
    });
    if (error) {
      console.error("CREATE TASK ERROR:", error);
      throw error;
    }
    fetchTasks();
  };

  const applyToTask = async (taskId: string) => {
    if (!state.currentUser) {
      console.warn("Cannot apply to task: No user logged in.");
      return;
    }
    console.log("Applying to task:", taskId, "as PRO:", state.currentUser.id);

    // Using .select() after update to verify if the row was actually updated (RLS check)
    const { data, error } = await supabase
      .from('tasks')
      .update({ pro_id: state.currentUser.id, status: 'accepted' })
      .eq('id', taskId)
      .select();

    if (error) {
      console.error("Error applying to task:", error.message);
      throw error;
    }

    if (!data || data.length === 0) {
      console.error("Update failed: No rows were affected. This usually means a RLS policy is blocking the update for this specific row.");
      throw new Error("No tienes permisos para aceptar esta tarea o la tarea ya no está disponible.");
    }

    console.log("Successfully updated task in DB:", data[0]);
    await fetchTasks();
  };

  const getChatForPro = async (proId: string): Promise<Chat> => {
    if (!state.currentUser) throw new Error("Auth required");
    const existingChat = state.chats.find(c =>
      c.participants.includes(state.currentUser!.id) && c.participants.includes(proId)
    );
    if (existingChat) return existingChat;

    const { data, error } = await supabase
      .from('chats')
      .insert({ participants: [state.currentUser.id, proId] })
      .select()
      .single();

    if (error) throw error;
    const newChat: Chat = { id: data.id, participants: data.participants, messages: [] };
    setState(prev => ({ ...prev, chats: [...prev.chats, newChat] }));
    return newChat;
  };

  const sendMessage = async (chatId: string, text: string) => {
    if (!state.currentUser) return;
    console.log(`[AppContext] Sending message to chat ${chatId} as ${state.currentUser.id}: ${text}`);
    const { error } = await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: state.currentUser.id,
      text
    });
    if (error) {
      console.error("[AppContext] FAILED to send message:", error.message, error.details);
      throw error;
    }
    console.log("[AppContext] Message sent successfully, refreshing chats...");
    fetchChats();
  };

  const createPaymentPreference = async (taskId: string, amount: number, description: string): Promise<string> => {
    if (!state.currentUser) throw new Error("Auth required");
    console.log("Creating payment preference for task:", taskId, "Amount:", amount);
    const { data, error } = await supabase.functions.invoke('mercadopago-payment', {
      body: { taskId, amount, description, userEmail: state.currentUser.email }
    });

    if (error) {
      console.error("Supabase function invoke error:", error);
      throw new Error("Error de conexión con la función de pago.");
    }

    if (data?.error) {
      console.error("Mercado Pago API Error returned in 200 response:", data);
      const detailStr = data.details ? JSON.stringify(data.details) : data.error;
      throw new Error("Mercado Pago dice: " + detailStr);
    }

    if (!data?.init_point) {
      console.error("Invalid response format:", data);
      throw new Error("No se pudo obtener el link de pago.");
    }
    return data.init_point;
  };

  return (
    <AppContext.Provider value={{
      state, login, register, logout, updateUser, toggleProMode,
      createTask, applyToTask, addCard, sendMessage, getChatForPro,
      createPaymentPreference
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
