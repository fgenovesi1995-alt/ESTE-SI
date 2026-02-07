
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useApp();

  const isActive = (path: string) => location.pathname === path;
  
  const activeClass = state.isProMode ? 'text-emerald-600' : 'text-primary';
  const inactiveClass = 'text-gray-400';

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 px-6 py-2 pb-safe flex items-center justify-between z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
      <button 
        onClick={() => navigate('/')}
        className={`flex flex-col items-center gap-1 transition-colors ${isActive('/') ? activeClass : inactiveClass}`}
      >
        <span className={`material-symbols-outlined ${isActive('/') ? 'filled' : ''}`}>home</span>
        <span className="text-[10px] font-medium">Inicio</span>
      </button>

      {/* Replaced Publicar with Tareas */}
      <button 
        onClick={() => navigate('/tasks')}
        className={`flex flex-col items-center gap-1 transition-colors ${isActive('/tasks') ? activeClass : inactiveClass}`}
      >
        <span className={`material-symbols-outlined ${isActive('/tasks') ? 'filled' : ''}`}>assignment</span>
        <span className="text-[10px] font-medium">Tareas</span>
      </button>

      <button 
        onClick={() => navigate('/inbox')}
        className={`flex flex-col items-center gap-1 transition-colors ${isActive('/inbox') ? activeClass : inactiveClass}`}
      >
        <span className={`material-symbols-outlined ${isActive('/inbox') ? 'filled' : ''}`}>chat</span>
        <span className="text-[10px] font-medium">Mensajes</span>
      </button>

      <button 
        onClick={() => navigate('/profile')}
        className={`flex flex-col items-center gap-1 transition-colors ${isActive('/profile') ? activeClass : inactiveClass}`}
      >
        <span className={`material-symbols-outlined ${isActive('/profile') ? 'filled' : ''}`}>person</span>
        <span className="text-[10px] font-medium">Mi Perfil</span>
      </button>
    </nav>
  );
};

export default BottomNav;
