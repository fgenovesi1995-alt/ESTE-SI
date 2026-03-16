
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

const ProDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state, applyToTask } = useApp();

  const availableTasks = state.tasks.filter(t => t.status === 'pending');
  const proProfile = state.professionals.find(p => p.id === 'p1') || state.professionals[0];

  return (
    <div className="flex flex-col min-h-screen bg-emerald-50 dark:bg-background-dark pb-24">
      {/* Visual Identity Override: Primary is now Emerald */}
      <style>{`
        :root { --primary: #10b981; }
        .text-primary { color: #10b981 !important; }
        .bg-primary { background-color: #10b981 !important; }
      `}</style>

      <Header />

      <main className="flex-1 px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              Panel Profesional
            </p>
            <h1 className="text-2xl font-bold">¡Hola, {state.currentUser?.name}!</h1>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900">
            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Ganancias</p>
            <p className="text-sm font-black text-emerald-600">${proProfile.earnings?.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900">
            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Trabajos</p>
            <p className="text-sm font-black">{proProfile.completedJobs}</p>
          </div>
          <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900">
            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Rating</p>
            <p className="text-sm font-black flex items-center gap-1">
              {proProfile.rating} <span className="material-symbols-outlined text-xs text-yellow-500 filled">star</span>
            </p>
          </div>
        </div>

        {/* Available Tasks */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Pedidos Disponibles</h2>
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-md">
              {availableTasks.length} NUEVOS
            </span>
          </div>

          <div className="space-y-4">
            {availableTasks.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-surface-dark rounded-3xl border-2 border-dashed border-emerald-100">
                <p className="text-gray-400 text-sm">No hay pedidos nuevos en tu zona por ahora.</p>
              </div>
            ) : (
              availableTasks.map(task => (
                <div key={task.id} className="bg-white dark:bg-surface-dark p-4 rounded-3xl shadow-md border border-gray-100 dark:border-emerald-900 group">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase mb-1 inline-block">
                        {task.category}
                      </span>
                      <h3 className="font-bold text-sm">Pedido de {task.userName}</h3>
                    </div>
                    <p className="text-[9px] text-gray-400">Hace 5 min</p>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {task.description}
                  </p>

                  {task.photo && (
                    <img src={task.photo} className="w-full h-32 object-cover rounded-2xl mb-4" alt="Tarea" />
                  )}

                  <button
                    onClick={async () => {
                      if (!state.currentUser?.name || !state.currentUser?.lastName || !state.currentUser?.dni || !state.currentUser?.photo) {
                        alert("⚠️ Perfil Incompleto\n\nDebes completar tus datos (Nombre, Apellido, DNI y Foto) en 'Mi Perfil' antes de postularte a trabajos.");
                        navigate('/profile');
                        return;
                      }
                      try {
                        await applyToTask(task.id);
                      } catch (err: any) {
                        alert("Error al postularte: " + err.message);
                      }
                    }}
                    className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Postularme
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default ProDashboard;
