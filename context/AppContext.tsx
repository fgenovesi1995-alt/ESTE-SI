import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, Task, Chat, Professional, AppState, Role, Message, Card, InAppNotification } from '../types';
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
  createTask: (category: string, description: string, photo?: string, location?: { lat: number, lng: number }, budget?: number) => Promise<void>;
  applyToTask: (taskId: string) => Promise<void>;
  addCard: (card: Omit<Card, 'id'>) => void;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  getChatForPro: (proId: string) => Promise<Chat>;
  fetchNotifications: () => Promise<void>;
  createPaymentPreference: (taskId: string, amount: number, description: string) => Promise<string>;
  finalizeTask: (taskId: string) => Promise<void>;
  resolveDispute: (disputeId: string, resolution: 'pro' | 'user') => Promise<void>;
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
    isProMode: false,
    isInitialized: false
  });

  const profileFetchPromise = useRef<Promise<User | null> | null>(null);

  // --- Utility Functions ---

  const safeDate = (dateStr: any) => {
    if (!dateStr) return new Date().toISOString();
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  };

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
      console.log("[AppContext] Fetching tasks with profiles...");
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          creator:profiles!tasks_user_id_fkey(first_name, last_name, photo),
          pro:profiles!tasks_pro_id_fkey(first_name, last_name, photo)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase fetchTasks error:", error.message);
        return;
      }

      if (data) {
        const tasks: Task[] = data.map(t => {
          const creator = t.creator as any;
          const proProfile = t.pro as any;

          return {
            id: t.id,
            userId: t.user_id,
            userName: creator ? `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || 'Usuario' : 'Usuario',
            userLastName: '', // We already concatenated it into name for simplicity in UI
            proId: t.pro_id,
            proName: proProfile ? `${proProfile.first_name || ''} ${proProfile.last_name || ''}`.trim() || 'Profesional' : 'Profesional',
            proLastName: '',
            category: t.category,
            description: t.description,
            photo: t.photo,
            location: t.location,
            status: t.status,
            createdAt: t.created_at
          };
        });
        console.log(`[AppContext] Fetched ${tasks.length} tasks successfully.`);
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
        .select(`
          *,
          messages(*)
        `)
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
            timestamp: safeDate(m.timestamp || m.inserted_at)
          })).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        }));
        setState(prev => ({ ...prev, chats }));

        // Fetch missing profiles for participants
        const allParticipantIds = Array.from(new Set(chats.flatMap(c => c.participants)));
        const missingIds = allParticipantIds.filter(id => id !== state.currentUser?.id);

        if (missingIds.length > 0) {
          console.log("[AppContext] Fetching missing profiles for participants:", missingIds);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, photo, role, category, rating, is_premium, bio, reviews_count, price_per_hour, earnings, completed_jobs')
            .in('id', missingIds);

          const profiles = profilesData as any[];

          if (profiles) {
            console.log(`[AppContext] Fetched ${profiles.length} participant profiles.`);
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
                if (existingIndex === -1) {
                  newProfiles.push(u);
                } else {
                  newProfiles[existingIndex] = u; // Ensure we update the name/photo
                }
              });

              const fetchedPros = profiles.filter(p => p.role === 'pro').map(p => ({
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

              const newPros = [...prev.professionals];
              fetchedPros.forEach(fp => {
                const existingIndex = newPros.findIndex(p => p.id === fp.id);
                if (existingIndex === -1) {
                  newPros.push(fp);
                } else {
                  newPros[existingIndex] = fp; // Update existing
                }
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
      console.log("[AppContext] Fetching notifications...");
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', state.currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
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
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', state.currentUser.id);

      if (!error) {
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => ({ ...n, read: true }))
        }));
      }
    } catch (e) {
      console.error("[AppContext] markNotificationsAsRead error:", e);
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
      fetchNotifications();
      checkAccountStatus();

      // Register for push notifications if on native platform
      if (Capacitor.isNativePlatform()) {
        registerPushNotifications();
      }
    }
  }, [state.currentUser?.id]);

  useEffect(() => {
    if (!state.currentUser) return;

    console.log("[AppContext] Setting up real-time subscriptions for user:", state.currentUser.id);

    // 1. Chat Sub (messages)
    const chatSub = supabase
      .channel('chat_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        console.log("[AppContext] REALTIME MESSAGE RECEIVED:", payload.new);
        setTimeout(() => fetchChats(), 500);
      })
      .subscribe();

    // 2. Task Sub (status updates)
    const taskSub = supabase
      .channel('task_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, (payload) => {
        console.log("[AppContext] REALTIME TASK UPDATE RECEIVED:", payload.new);
        fetchTasks();
      })
      .subscribe();

    // 3. Notification Sub
    const notifSub = supabase
      .channel('notification_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${state.currentUser.id}`
      }, (payload) => {
        console.log("[AppContext] REALTIME NOTIFICATION RECEIVED:", payload.new);
        fetchNotifications();
      })
      .subscribe();

    return () => {
      console.log("[AppContext] Cleaning up subscriptions...");
      supabase.removeChannel(chatSub);
      supabase.removeChannel(taskSub);
      supabase.removeChannel(notifSub);
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
    if (data.dni) updates.dni = data.dni;
    if (data.photo) updates.photo = data.photo;
    if (data.cbuAlias) updates.cbu_alias = data.cbuAlias;
    if (data.criminalRecordUrl) updates.criminal_record_url = data.criminalRecordUrl;
    if (data.profession) updates.profession = data.profession;

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

  const createTask = async (category: string, description: string, photo?: string, location?: { lat: number, lng: number }, budget?: number) => {
    if (!state.currentUser) return;
    const { error } = await supabase.from('tasks').insert({
      user_id: state.currentUser.id,
      category,
      description,
      photo,
      location,
      budget,
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

    // UI/Legal Banner Logic
    const protectionFee = amount * 0.05;
    const totalAmount = amount + protectionFee;

    console.log("Creating escrow payment preference for task:", taskId, "Amount:", amount, "Protection Fee:", protectionFee);

    const { data, error } = await supabase.functions.invoke('mercadopago-payment', {
      body: {
        taskId,
        amount: totalAmount,
        description: `${description} (Incluye Costo de Protección y Garantía)`,
        userEmail: state.currentUser.email,
        isEscrow: true
      }
    });

    if (error) {
      console.error("Supabase function invoke error:", error);
      throw new Error("Error de conexión con la función de pago.");
    }

    if (data?.error) {
      console.error("Mercado Pago API Error:", data);
      throw new Error("Mercado Pago dice: " + data.error);
    }

    if (!data?.init_point) {
      throw new Error("No se pudo obtener el link de pago.");
    }
    return data.init_point;
  };

  const finalizeTask = async (taskId: string) => {
    console.log("[AppContext] Finalizing task:", taskId);
    // 1. Update task status to paid
    const { error: taskError } = await supabase
      .from('tasks')
      .update({ status: 'paid' })
      .eq('id', taskId);
    if (taskError) throw taskError;

    // 2. Fetch the transaction associated with this task
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('task_id', taskId)
      .eq('type', 'payment')
      .single();

    if (tx) {
      // Update transaction status to released
      await supabase.from('transactions').update({ status: 'released' }).eq('id', tx.id);

      let amountToCredit = tx.net_amount;

      // --- Debt Recovery Logic ---
      const { data: debts } = await supabase
        .from('debt_history')
        .select('*')
        .eq('pro_id', tx.pro_id)
        .gt('remaining_amount', 0)
        .order('created_at', { ascending: true });

      if (debts && debts.length > 0) {
        console.log("[AppContext] Found debts for PRO. Applying recovery...");
        for (const debt of debts) {
          if (amountToCredit <= 0) break;

          const settlement = Math.min(amountToCredit, debt.remaining_amount);
          amountToCredit -= settlement;

          const newRemaining = debt.remaining_amount - settlement;
          await supabase.from('debt_history').update({
            remaining_amount: newRemaining,
            settled_at: newRemaining === 0 ? new Date().toISOString() : null
          }).eq('id', debt.id);

          console.log(`[AppContext] Debt ${debt.id} partially/fully settled with $${settlement}`);
        }
      }

      // Update PRO balance (what's left after debt recovery)
      const { data: proProfile } = await supabase.from('profiles').select('current_balance').eq('id', tx.pro_id).single();
      const newBalance = (proProfile?.current_balance || 0) + amountToCredit;

      await supabase.from('profiles').update({
        current_balance: newBalance,
        completed_jobs: supabase.rpc('increment', { row_id: tx.pro_id, column_name: 'completed_jobs' })
      }).eq('id', tx.pro_id);
    }
    fetchTasks();
  };

  const resolveDispute = async (disputeId: string, resolution: 'pro' | 'user') => {
    console.log("[AppContext] Resolving dispute:", disputeId, "Resolution:", resolution);
    const { data: dispute } = await supabase.from('disputes').select('*').eq('id', disputeId).single();
    if (!dispute) return;

    if (resolution === 'user') {
      // PRO abandoned/failed. Create DEBT.
      const { data: tx } = await supabase.from('transactions').select('*').eq('task_id', dispute.task_id).single();
      if (tx) {
        // Create debt record
        await supabase.from('debt_history').insert({
          pro_id: dispute.pro_id,
          user_id: dispute.user_id,
          amount: tx.amount,
          remaining_amount: tx.amount,
          source_dispute_id: dispute.id
        });

        // Negative balance on PRO
        const { data: pro } = await supabase.from('profiles').select('current_balance').eq('id', dispute.pro_id).single();
        await supabase.from('profiles').update({
          current_balance: (pro?.current_balance || 0) - tx.amount,
          last_debt_date: new Date().toISOString()
        }).eq('id', dispute.pro_id);
      }
    }

    await supabase.from('disputes').update({ status: `resolved_${resolution}`, resolved_at: new Date().toISOString() }).eq('id', dispute.id);
  };

  const checkAccountStatus = async () => {
    if (!state.currentUser || state.currentUser.role !== 'pro') return;

    console.log("[AppContext] Checking account health for PRO:", state.currentUser.id);
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_balance, dispute_count, last_debt_date')
      .eq('id', state.currentUser.id)
      .single();

    if (profile) {
      let shouldSuspend = false;
      const daysWithDebt = profile.last_debt_date ?
        (Number(new Date()) - Number(new Date(profile.last_debt_date))) / (1000 * 60 * 60 * 24) : 0;

      // AUTO-BAN RULES:
      // 1. More than 2 unresolved claims
      if (profile.dispute_count >= 2) shouldSuspend = true;
      // 2. Debt older than 30 days
      if (profile.current_balance < 0 && daysWithDebt > 30) shouldSuspend = true;

      if (shouldSuspend) {
        console.warn("[AppContext] !!! ACCOUNT SUSPENDED !!!");
        await supabase.from('profiles').update({ is_suspended: true }).eq('id', state.currentUser.id);
        setState(prev => ({ ...prev, currentUser: { ...prev.currentUser!, isSuspended: true } }));
      }
    }
  };

  return (
    <AppContext.Provider value={{
      state, login, register, logout, updateUser, toggleProMode,
      createTask, applyToTask, sendMessage, getChatForPro, fetchNotifications,
      createPaymentPreference, finalizeTask, resolveDispute, checkAccountStatus
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
