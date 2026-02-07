
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

const ProfessionalList: React.FC<{ isPremiumOnly?: boolean }> = ({ isPremiumOnly = false }) => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  const [sortBy, setSortBy] = useState<'rating' | 'price'>('rating');

  const filteredPros = state.professionals.filter(p => {
    const matchesCategory = categoryId ? p.category.toLowerCase().includes(categoryId.toLowerCase()) : true;
    const matchesPremium = isPremiumOnly ? p.isPremium : true;
    return matchesCategory && matchesPremium;
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    return (a.pricePerHour || 0) - (b.pricePerHour || 0);
  });

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
      <Header />
      
      <main className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-surface-dark rounded-xl shadow-sm">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold">
            {isPremiumOnly ? 'Premium' : categoryId || 'Profesionales'}
          </h1>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setSortBy('rating')}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              sortBy === 'rating' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-surface-dark text-gray-500'
            }`}
          >
            Mejor Puntaje
          </button>
          <button 
            onClick={() => setSortBy('price')}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              sortBy === 'price' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-surface-dark text-gray-500'
            }`}
          >
            Menor Precio
          </button>
        </div>

        <div className="space-y-4">
          {filteredPros.map(pro => (
            <div 
              key={pro.id} 
              onClick={() => navigate(`/chat/${pro.id}`)}
              className="bg-white dark:bg-surface-dark p-4 rounded-3xl shadow-md border border-gray-50 dark:border-gray-800 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="relative">
                <img src={pro.photo} className="size-16 rounded-2xl object-cover" alt="" />
                {pro.isPremium && (
                  <div className="absolute -top-1 -right-1 bg-yellow-500 text-white rounded-full p-0.5">
                    <span className="material-symbols-outlined text-[10px] filled">star</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm">{pro.name}</h3>
                  <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded-lg">
                    <span className="material-symbols-outlined text-[10px] text-yellow-500 filled">star</span>
                    <span className="text-[10px] font-black">{pro.rating}</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mb-1">{pro.category} • {pro.location}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-primary">${pro.pricePerHour}/h</p>
                  <p className="text-[9px] text-gray-500 font-bold">{pro.reviewsCount} reseñas</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ProfessionalList;
