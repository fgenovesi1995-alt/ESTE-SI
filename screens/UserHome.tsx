
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import ProDashboard from './ProDashboard';

const CATEGORIES = [
  { id: 'Electricidad', name: 'Electricidad', icon: 'bolt', color: 'bg-yellow-100 text-yellow-600' },
  { id: 'Plomería', name: 'Plomería', icon: 'water_drop', color: 'bg-blue-100 text-blue-600' },
  { id: 'Gas', name: 'Gas', icon: 'local_fire_department', color: 'bg-orange-100 text-orange-600' },
  { id: 'Aire Acondicionado', name: 'Aire Acond', icon: 'ac_unit', color: 'bg-cyan-100 text-cyan-600' },
  { id: 'Carpintería', name: 'Carpintería', icon: 'handyman', color: 'bg-amber-100 text-amber-600' },
  { id: 'Herrería', name: 'Herrería', icon: 'hardware', color: 'bg-slate-100 text-slate-600' },
  { id: 'Pintura', name: 'Pintura', icon: 'format_paint', color: 'bg-red-100 text-red-600' },
  { id: 'Limpieza', name: 'Limpieza', icon: 'mop', color: 'bg-purple-100 text-purple-600' },
  { id: 'Jardinería', name: 'Jardinería', icon: 'yard', color: 'bg-green-100 text-green-600' },
  { id: 'Cerrajería', name: 'Cerrajería', icon: 'lock', color: 'bg-stone-100 text-stone-600' },
  { id: 'Mudanzas', name: 'Mudanzas', icon: 'local_shipping', color: 'bg-indigo-100 text-indigo-600' },
  { id: 'Electrónica', name: 'Electrónica', icon: 'memory', color: 'bg-emerald-100 text-emerald-600' }
];

const UserHome: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useApp();

  const [showTransparency, setShowTransparency] = React.useState(() => {
    return !sessionStorage.getItem('transparency_accepted_user');
  });

  const handleAcceptTransparency = () => {
    sessionStorage.setItem('transparency_accepted_user', 'true');
    setShowTransparency(false);
  };

  if (state.isProMode) return <ProDashboard />;

  const premiumPros = state.professionals
    .filter(p => p.isPremium)
    .sort((a, b) => {
      const aDeudor = (a as any).current_balance < 0;
      const bDeudor = (b as any).current_balance < 0;
      if (aDeudor && !bDeudor) return 1;
      if (!aDeudor && bDeudor) return -1;
      return b.rating - a.rating;
    });

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-24">
      <Header />

      <main className="flex-1 px-4 py-6">
        {/* Personalized Greeting */}
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            Hola, {state.currentUser?.name || 'Invitado'}
          </p>
        </div>

        {/* Search Redirector */}
        <button
          onClick={() => navigate('/create-task')}
          className="w-full relative mb-8 flex items-center bg-white dark:bg-surface-dark border-none rounded-2xl py-4 pl-12 pr-4 shadow-md text-gray-400 text-sm transition-all hover:ring-2 hover:ring-primary/20 text-left"
        >
          <span className="material-symbols-outlined absolute left-4 text-gray-400">search</span>
          ¿Qué necesitas arreglar hoy?
        </button>

        {/* Categories Grid */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Categorías</h2>
            <button className="text-primary text-xs font-bold" onClick={() => navigate('/categories')}>Ver todo</button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {CATEGORIES.slice(0, 12).map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/category/${cat.id}`)}
                className="flex flex-col items-center gap-2 bg-white dark:bg-surface-dark p-3 rounded-2xl shadow-sm hover:scale-[1.02] active:scale-95 transition-all"
              >
                <div className={`size-10 rounded-full flex items-center justify-center ${cat.color}`}>
                  <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-center line-clamp-1">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Premium Professionals */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Profesionales Premium</h2>
            <button
              onClick={() => navigate('/premium-pros')}
              className="text-primary text-xs font-bold"
            >
              Ver todos
            </button>
          </div>

          <div className="flex overflow-x-auto gap-4 no-scrollbar -mx-4 px-4 snap-x">
            {premiumPros.map((pro) => (
              <div
                key={pro.id}
                onClick={() => navigate(`/chat/${pro.id}`)}
                className="flex-shrink-0 w-64 bg-white dark:bg-surface-dark rounded-2xl shadow-md overflow-hidden snap-start cursor-pointer group"
              >
                <div className="h-40 relative">
                  <img src={pro.photo} alt={pro.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/70 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-yellow-500 text-[14px] filled">star</span>
                    <span className="text-xs font-bold">{pro.rating}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                    Premium
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-base">{pro.name}</h3>
                  <p className="text-gray-500 text-xs mb-3">{(pro as any).profession || pro.category} • {pro.location}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold text-sm">Desde ${pro.pricePerHour}/h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />

      {/* Transparency Modal */}
      {showTransparency && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
              <span className="material-symbols-outlined text-3xl text-primary">gavel</span>
            </div>
            <h2 className="text-xl font-bold text-center mb-4">Transparencia Arreglados</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed mb-8">
              Arreglados es un facilitador tecnológico que solo facilita el contacto.
              <span className="block mt-2 font-bold text-primary">No somos empleadores ni contratistas de los profesionales.</span>
            </p>
            <button
              onClick={handleAcceptTransparency}
              className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              Entendido y Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserHome;
