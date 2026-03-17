import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BottomNav from '../components/BottomNav';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

const TasksHistory: React.FC = () => {
  const navigate = useNavigate();
  const { state, createPaymentPreference, fetchTasks, finalizeTask } = useApp();

  const myTasks = state.isProMode
    ? state.tasks.filter(t => t.proId === state.currentUser?.id)
    : state.tasks.filter(t => t.userId === state.currentUser?.id);

  const handlePayment = async (task: any) => {
    try {
      // MP Argentina minimum is ~100 ARS. Using 500 for a real test.
      const amount = 500;
      const url = await createPaymentPreference(task.id, amount, `Pago por servicio: ${task.category}`);
      if (Capacitor.isNativePlatform()) {
        // Listen for browser close to refresh tasks (webhook may have updated status)
        await Browser.addListener('browserFinished', () => {
          fetchTasks();
          Browser.removeAllListeners();
        });
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
                    <p className="text-[10px] text-gray-400 font-medium">
                      {state.isProMode
                        ? `Solicitado por: ${task.userName}`
                        : task.status !== 'pending' && task.proId
                          ? `Tomado por: ${task.proName}`
                          : 'Buscando profesional...'}
                    </p>
                    {task.budget && (
                      <p className="text-[10px] text-primary font-bold mt-1">
                        Presupuesto sugerido: ${task.budget.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${task.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    task.status === 'paid' || task.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                    {task.status === 'pending' ? 'Buscando Pro' :
                      task.status === 'accepted' ? 'En curso' :
                        task.status === 'paid' ? 'Pagado' : 'Finalizado'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-gray-400">calendar_today</span>
                    <p className="text-[10px] text-gray-500">
                      {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '--/--/--'}
                    </p>
                  </div>
                  {(task.status === 'accepted' || task.status === 'completed') && (
                    <div className="flex flex-col items-end gap-3 w-full max-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <input type="checkbox" id={`legal-${task.id}`} className="size-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <label htmlFor={`legal-${task.id}`} className="text-[9px] text-gray-400 leading-tight">
                          Entiendo que Arreglados es solo un intermediario y la responsabilidad es directa con el PRO.
                        </label>
                      </div>

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
                            onClick={() => {
                              const checkbox = document.getElementById(`legal-${task.id}`) as HTMLInputElement;
                              if (!checkbox.checked) {
                                alert("Debes aceptar los términos de intermediación para proceder al pago.");
                                return;
                              }
                              handlePayment(task);
                            }}
                            className="bg-primary text-white text-xs font-black px-6 py-3 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                          >
                            PAGAR CON GARANTÍA
                          </button>
                        )}
                      </div>
                      <p className="text-[8px] text-gray-400 text-right italic">
                        * Tu pago queda en Escrow (Protección Arreglados) hasta que confirmes la finalización.
                      </p>
                    </div>
                  )}
                  {task.status === 'escrow' && (
                    <div className="flex flex-col items-end gap-2">
                      <span className="bg-yellow-50 text-yellow-700 text-[9px] font-bold px-2 py-1 rounded">FONDO EN ESCROW</span>
                      {!state.isProMode && (
                        <button
                          className="bg-blue-600 text-white text-[10px] font-bold px-4 py-2 rounded-xl active:scale-95 shadow-lg shadow-blue-500/20"
                          onClick={async () => {
                            if (window.confirm("¿Confirmás que el trabajo finalizó correctamente? Se liberarán los fondos al profesional y no habrá reembolso posterior.")) {
                              try {
                                await finalizeTask(task.id);
                                alert("¡Pago liberado exitosamente!");
                              } catch (e: any) {
                                alert("Error: " + e.message);
                              }
                            }
                          }}
                        >
                          CONFIRMAR FINALIZACIÓN
                        </button>
                      )}
                      <p className="text-[8px] text-gray-400 max-w-[150px] text-right">
                        Al confirmar, liberas los fondos al PRO. La transacción se considera cerrada.
                      </p>
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
