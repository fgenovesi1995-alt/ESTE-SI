
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import LegalBanner from '../components/LegalBanner';

const ProDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state, applyToTask } = useApp();

  const availableTasks = state.tasks.filter(t => t.status === 'pending');
  // Use current user directly if it's a PRO
  const proProfile = state.currentUser;

  const [showTransparency, setShowTransparency] = React.useState(() => {
    return !sessionStorage.getItem('transparency_accepted');
  });

  const handleAcceptTransparency = () => {
    sessionStorage.setItem('transparency_accepted', 'true');
    setShowTransparency(false);
  };

  return (
    <div className="flex flex-col h-screen bg-emerald-50 dark:bg-background-dark">
      {/* Visual Identity Override: Primary is now Emerald */}
      <style>{`
        :root { --primary: #10b981; }
        .text-primary { color: #10b981 !important; }
        .bg-primary { background-color: #10b981 !important; }
      `}</style>

      <Header />

      <main className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar pb-32">
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
          <button
            onClick={() => navigate('/account')}
            className="bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900 text-left active:scale-95 transition-all"
          >
            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">
              Saldo <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
            </p>
            <p className={`text-sm font-black ${(proProfile as any)?.current_balance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              ${((proProfile as any)?.current_balance || 0).toLocaleString()}
            </p>
          </button>
          <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900">
            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Trabajos</p>
            <p className="text-sm font-black">{(proProfile as any)?.completed_jobs || 0}</p>
          </div>
          <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900">
            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Rating</p>
            <p className="text-sm font-black flex items-center gap-1">
              {(proProfile as any)?.completed_jobs > 0 ? ((proProfile as any)?.rating || 0).toFixed(1) : '0.0'} <span className="material-symbols-outlined text-xs text-yellow-500 filled">star</span>
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

      {/* Transparency Modal */}
      {showTransparency && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="size-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 mx-auto">
              <span className="material-symbols-outlined text-3xl text-emerald-600">gavel</span>
            </div>
            <h2 className="text-xl font-bold text-center mb-4">Transparencia Arreglados</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed mb-8">
              Arreglados es un facilitador tecnológico que solo facilita el contacto.
              <span className="block mt-2 font-bold text-emerald-600">No somos empleadores ni contratistas de los profesionales.</span>
            </p>
            <button
              onClick={handleAcceptTransparency}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Entendido y Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProDashboard;
