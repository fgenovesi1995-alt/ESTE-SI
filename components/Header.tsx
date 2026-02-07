
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useApp();
  const [showNotif, setShowNotif] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
      <div 
        className="flex items-center gap-1 cursor-pointer"
        onClick={() => navigate('/')}
      >
        <h1 className="text-xl font-bold text-primary">Arreglados</h1>
        <span className="text-lg">🔧</span>
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
