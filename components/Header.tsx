
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useApp();
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
            {state.notifications.length > 0 && (
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-surface-dark rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 p-4 animate-in fade-in zoom-in duration-200">
              <h3 className="font-bold text-sm mb-2">Notificaciones</h3>
              <p className="text-xs text-gray-500">No tienes notificaciones nuevas por ahora.</p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
