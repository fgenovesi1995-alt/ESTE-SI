
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { state, markNotificationsAsRead } = useApp();
  const [showNotif, setShowNotif] = useState(false);

  return (
    <header className="bg-white dark:bg-surface-dark p-4 pt-[env(safe-area-inset-top,20px)] flex justify-between items-center border-b border-gray-100 dark:border-gray-800 shadow-sm transition-colors sticky top-0 z-50">
      <div
        className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
        onClick={() => navigate('/home')}
      >
        <h1 className="text-xl font-bold text-primary">Arreglados</h1>
        <span className="text-lg">🔧</span>
        <span className="text-[10px] font-bold text-gray-400 ml-1">v2.1.6</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/map')}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
        >
          <span className="material-symbols-outlined">location_on</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <span className="material-symbols-outlined">notifications</span>
            {state.notifications.some(n => !n.read) && (
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-surface-dark"></span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-4 animate-in fade-in zoom-in duration-200 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm">Notificaciones</h3>
                {state.notifications.length > 0 && (
                  <button
                    onClick={() => markNotificationsAsRead()}
                    className="text-[10px] text-primary font-bold hover:underline"
                  >
                    Marcar como leídas
                  </button>
                )}
              </div>
              {state.notifications.length === 0 ? (
                <p className="text-xs text-gray-500">No tienes notificaciones nuevas por ahora.</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                  {state.notifications.map(n => (
                    <div key={n.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <p className="text-xs font-bold text-primary mb-1">{n.title}</p>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
