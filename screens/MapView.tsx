
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const MapView: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useApp();
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords({ lat: -34.6037, lng: -58.3816 }) // Default BA
    );
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="size-12 bg-white dark:bg-surface-dark rounded-full shadow-lg flex items-center justify-center text-slate-900 dark:text-white"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="bg-white dark:bg-surface-dark px-4 py-2 rounded-full shadow-lg font-bold text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-primary filled">location_on</span>
          Profesionales cerca
        </div>
      </header>

      <div className="flex-1 bg-blue-50 relative flex items-center justify-center overflow-hidden">
        {/* Mock Map Image */}
        <div 
          className="absolute inset-0 opacity-40 bg-center bg-cover"
          style={{backgroundImage: 'url("https://picsum.photos/seed/map/800/800")'}}
        />
        
        {/* Simulation of markers */}
        {state.professionals.slice(0, 5).map((pro, i) => (
          <div 
            key={pro.id}
            className="absolute animate-bounce"
            style={{ 
              top: `${20 + i * 15}%`, 
              left: `${15 + i * 18}%` 
            }}
          >
            <div className="flex flex-col items-center group cursor-pointer" onClick={() => navigate(`/pro/${pro.id}`)}>
               <div className="size-10 rounded-full border-4 border-white shadow-xl overflow-hidden ring-2 ring-primary">
                 <img src={pro.photo} className="w-full h-full object-cover" />
               </div>
               <div className="bg-white px-2 py-0.5 rounded-lg shadow-md mt-1 scale-0 group-hover:scale-100 transition-transform">
                 <p className="text-[10px] font-black">{pro.name}</p>
               </div>
            </div>
          </div>
        ))}

        <div className="z-10 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md p-6 rounded-3xl border border-white/50 text-center max-w-xs shadow-2xl">
           <span className="material-symbols-outlined text-primary text-4xl mb-2">explore</span>
           <h2 className="font-bold mb-1">Cerca de tu ubicación</h2>
           <p className="text-xs text-gray-500">Estamos encontrando los mejores profesionales para vos en esta zona.</p>
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-surface-dark rounded-t-3xl shadow-2xl z-20">
        <h3 className="font-bold mb-4">Recomendados en la zona</h3>
        <div className="flex overflow-x-auto gap-4 no-scrollbar">
          {state.professionals.slice(0, 3).map(pro => (
            <button 
              key={pro.id}
              onClick={() => navigate(`/chat/${pro.id}`)}
              className="flex-shrink-0 w-48 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center gap-3 border border-gray-100 dark:border-gray-700"
            >
              <img src={pro.photo} className="size-10 rounded-full object-cover" />
              <div className="text-left">
                <p className="text-xs font-bold truncate w-24">{pro.name}</p>
                <p className="text-[9px] text-primary font-bold">{pro.category}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapView;
