import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

const TasksHistory: React.FC = () => {
  const navigate = useNavigate();
  const { state, createPaymentPreference } = useApp();

  const myTasks = state.isProMode
    ? state.tasks.filter(t => t.proId === state.currentUser?.id)
    : state.tasks.filter(t => t.userId === state.currentUser?.id);

  const handlePayment = async (task: any) => {
    try {
      // If it's the test task, we use $10, otherwise default to $5000 (standard for now)
      const amount = task.description.includes('enchufe') ? 10 : 5000;
      const url = await createPaymentPreference(task.id, amount, `Pago por servicio: ${task.category}`);
      // Use Capacitor Browser plugin when running as native app, fall back to window.open for web
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url, windowName: '_blank' });
      } else {
        window.open(url, '_blank');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-32">
      <header className="p-6 pt-[env(safe-area-inset-top,24px)] bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
        <button onClick={() => navigate('/home')} className="p-1 -ml-2">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold flex-1">
          {state.isProMode ? 'Mis Trabajos' : 'Mis Pedidos'}
        </h1>
      </header>

      <main className="p-6 pt-2">

        <div className="space-y-4">
          {myTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
              <span className="material-symbols-outlined text-6xl mb-4">history_toggle_off</span>
              <p className="text-sm">No hay registros para mostrar aún.</p>
            </div>
          ) : (
            myTasks.map(task => (
              <div key={task.id} className="bg-white dark:bg-surface-dark p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md mb-1 inline-block">
                      {task.category}
                    </span>
                    <h3 className="font-bold">{task.description.substring(0, 30)}...</h3>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${task.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>
                    {task.status === 'pending' ? 'Buscando Pro' : 'En curso'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-gray-400">calendar_today</span>
                    <p className="text-[10px] text-gray-500">
                      {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '--/--/--'}
                    </p>
                  </div>
                  {task.status === 'accepted' && (
                    <div className="flex gap-4">
                      <button
                        onClick={() => navigate(`/chat/${state.isProMode ? task.userId : task.proId}`)}
                        className="text-gray-500 text-xs font-bold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">chat</span>
                        Chat
                      </button>

                      {!state.isProMode && (
                        <button
                          onClick={() => handlePayment(task)}
                          className="bg-primary text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                        >
                          PAGAR $5.000
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default TasksHistory;
