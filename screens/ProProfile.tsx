
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const ProProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();

  const pro = state.professionals.find(p => p.id === id);

  if (!pro) return <div className="p-10 text-center">No encontrado</div>;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 p-4 flex justify-between">
        <button 
          onClick={() => navigate('/')} 
          className="size-10 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 dark:text-white"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <button className="size-10 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 dark:text-white">
          <span className="material-symbols-outlined">share</span>
        </button>
      </header>

      <div className="h-64 relative">
        <img src={pro.photo} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent"></div>
      </div>

      <div className="px-6 -mt-20 relative z-10">
        <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{pro.name}</h1>
              <p className="text-primary font-bold text-sm">{pro.category}</p>
            </div>
            {pro.isPremium && (
              <span className="bg-yellow-100 text-yellow-700 text-[10px] font-black px-2 py-1 rounded-lg uppercase">Premium</span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6 border-y border-gray-100 dark:border-gray-800 py-4">
            <div className="text-center">
              <p className="text-sm font-bold">{pro.rating}</p>
              <p className="text-[10px] text-gray-500 uppercase">Puntaje</p>
            </div>
            <div className="text-center border-x border-gray-100 dark:border-gray-800">
              <p className="text-sm font-bold">{pro.reviewsCount}</p>
              <p className="text-[10px] text-gray-500 uppercase">Reseñas</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold">Matricul.</p>
              <p className="text-[10px] text-gray-500 uppercase">Estado</p>
            </div>
          </div>

          <h3 className="font-bold text-base mb-2">Sobre mí</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
            {pro.bio}
          </p>

          <div className="space-y-4">
             <div className="flex items-center gap-3">
               <div className="size-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-primary">
                 <span className="material-symbols-outlined">location_on</span>
               </div>
               <div>
                 <p className="text-xs text-gray-500">Ubicación</p>
                 <p className="text-sm font-semibold">{pro.location}</p>
               </div>
             </div>

             <div className="flex items-center gap-3">
               <div className="size-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-600">
                 <span className="material-symbols-outlined">payments</span>
               </div>
               <div>
                 <p className="text-xs text-gray-500">Precio estimado</p>
                 <p className="text-sm font-semibold">${pro.pricePerHour} / hora</p>
               </div>
             </div>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button 
            onClick={() => navigate(`/chat/${pro.id}`)}
            className="flex-1 bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            Chatear ahora
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProProfile;
