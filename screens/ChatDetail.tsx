import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';

const ChatDetail: React.FC = () => {
  const { id: otherId } = useParams();
  const navigate = useNavigate();
  const { state, sendMessage, getChatForPro } = useApp();
  const [inputText, setInputText] = useState('');
  const [otherPerson, setOtherPerson] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentUser = state.currentUser;

  // Find chat in existing state
  const chat = state.chats.find(c =>
    otherId && currentUser &&
    c.participants.includes(otherId) &&
    c.participants.includes(currentUser.id)
  );

  // Fetch other person's profile
  useEffect(() => {
    if (!otherId) return;

    // Try to find in pros cache first
    const pro = state.professionals.find(p => p.id === otherId);
    if (pro) {
      setOtherPerson({ name: pro.name, photo: pro.photo });
      return;
    }

    // Fallback: Fetch from Supabase directly
    const fetchOther = async () => {
      const { data } = await supabase.from('profiles').select('first_name, last_name, photo').eq('id', otherId).single();
      if (data) {
        setOtherPerson({
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Usuario',
          photo: data.photo || 'https://picsum.photos/seed/user/200'
        });
      }
    };
    fetchOther();
  }, [otherId, state.professionals]);

  // If chat doesn't exist in state, ensure it's created/fetched
  useEffect(() => {
    if (otherId && currentUser && !chat) {
      getChatForPro(otherId).catch(console.error);
    }
  }, [otherId, currentUser, chat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat?.messages]);

  if (!otherPerson && !chat) return <div className="p-10 text-center text-slate-500">Cargando conversación...</div>;
  if (!otherPerson) return <div className="p-10 text-center">Persona no encontrada</div>;

  const handleSend = async () => {
    if (!inputText.trim() || !chat) return;
    const text = inputText;
    setInputText('');
    try {
      await sendMessage(chat.id, text);
    } catch (e) {
      console.error(e);
      setInputText(text); // Restore text on failure
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-background-dark overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-surface-dark px-4 py-3 pt-[env(safe-area-inset-top,24px)] flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 shadow-sm z-10 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <span className="material-symbols-outlined text-slate-900 dark:text-white">arrow_back</span>
        </button>
        <div className="relative">
          <img src={otherPerson.photo} alt={otherPerson.name} className="size-10 rounded-full object-cover" />
          <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white dark:border-surface-dark"></div>
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-sm leading-none mb-1 text-slate-900 dark:text-white">{otherPerson.name}</h2>
          <p className="text-[10px] text-gray-500 font-medium font-semibold">En línea ahora</p>
        </div>
        <button className="p-2 text-primary">
          <span className="material-symbols-outlined">call</span>
        </button>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
      >
        <div className="flex justify-center mb-6">
          <p className="bg-gray-200/50 dark:bg-gray-800/80 backdrop-blur-sm text-gray-500 dark:text-gray-400 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest">
            Hoy
          </p>
        </div>

        {chat && chat.messages.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-gray-400 font-medium">Saluda a {otherPerson.name} para comenzar la conversación.</p>
          </div>
        )}

        {chat?.messages.map((msg) => {
          const isMe = msg.senderId === state.currentUser?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-primary text-white rounded-br-none' : 'bg-white dark:bg-surface-dark text-slate-800 dark:text-slate-100 rounded-bl-none'
                }`}>
                {msg.text}
                <div className={`text-[9px] mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 pb-[env(safe-area-inset-bottom,20px)] bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400">
            <span className="material-symbols-outlined">add_circle</span>
          </button>
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-primary text-slate-900 dark:text-white"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || !chat}
            className="size-10 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-all active:scale-90 shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDetail;
