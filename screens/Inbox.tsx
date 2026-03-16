
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BottomNav from '../components/BottomNav';

const Inbox: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useApp();

  const userChats = state.chats.filter(c =>
    c.participants.includes(state.currentUser?.id || '') && c.messages.length > 0
  );

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-32">
      <header className="p-6 pt-[env(safe-area-inset-top,24px)] bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
        <button onClick={() => navigate('/home')} className="p-1 -ml-2">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold flex-1">Mensajes</h1>
      </header>

      <main className="p-4">
        {userChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="size-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-300">
              <span className="material-symbols-outlined text-4xl">chat_bubble_outline</span>
            </div>
            <p className="text-gray-500 font-medium">No tenés chats activos aún.</p>
            <button
              onClick={() => navigate('/')}
              className="text-primary font-bold text-sm"
            >
              Buscar profesionales
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {userChats.map(chat => {
              const otherId = chat.participants.find(p => p !== state.currentUser?.id);

              const otherPerson = state.profiles.find(p => p.id === otherId) || state.professionals.find(p => p.id === otherId);
              let displayName = otherPerson ? otherPerson.name : 'Usuario';
              let photo = otherPerson?.photo || 'https://picsum.photos/seed/user/200';

              return (
                <button
                  key={chat.id}
                  onClick={() => navigate(`/chat/${otherId}`)}
                  className="w-full bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 active:scale-[0.98] transition-all"
                >
                  <img src={photo} className="size-14 rounded-full object-cover" alt="" />
                  <div className="flex-1 text-left">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-sm">{displayName}</h3>
                      <span className="text-[10px] text-gray-400">
                        {chat.messages[chat.messages.length - 1].timestamp
                          ? new Date(chat.messages[chat.messages.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {chat.messages[chat.messages.length - 1].text}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Inbox;
