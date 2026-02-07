
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BottomNav from '../components/BottomNav';

const ProfileSettings: React.FC = () => {
  const navigate = useNavigate();
  const { state, logout, updateUser, addCard } = useApp();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  
  const [formData, setFormData] = useState({
    name: state.currentUser?.name || '',
    lastName: state.currentUser?.lastName || '',
    dni: state.currentUser?.dni || '',
    photo: state.currentUser?.photo || 'https://picsum.photos/seed/user/200'
  });

  const [cardData, setCardData] = useState({
    number: '',
    brand: 'Visa',
    expiry: ''
  });

  const handleSave = () => {
    if (!formData.name || !formData.lastName || !formData.dni || !formData.photo) {
      alert("Todos los campos (Nombre, Apellido, DNI y Foto) son estrictamente obligatorios.");
      return;
    }
    updateUser(formData);
    setIsEditing(false);
  };

  const handleAddCard = () => {
    if (!cardData.number || !cardData.expiry) return;
    addCard(cardData);
    setShowAddCard(false);
    setCardData({ number: '', brand: 'Visa', expiry: '' });
  };

  const handleModeSwitch = () => {
    const targetMode = state.isProMode ? "Usuario" : "Profesional";
    logout();
    navigate('/login', { 
      state: { message: `Para acceder al modo ${targetMode}, inicia sesión con tu cuenta de trabajador.` } 
    });
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-32">
      <header className="p-6 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ajustes</h1>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="text-primary font-bold text-sm"
        >
          {isEditing ? 'Guardar' : 'Editar'}
        </button>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Profile Info Block */}
        <section className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <img 
                src={formData.photo} 
                className="size-24 rounded-full object-cover ring-4 ring-primary/10" 
                alt="Avatar" 
              />
              {isEditing && (
                <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer">
                  <span className="material-symbols-outlined text-white">photo_camera</span>
                  <input type="file" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setFormData({...formData, photo: reader.result as string});
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre</label>
                <input 
                  type="text"
                  disabled={!isEditing}
                  className="w-full mt-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 disabled:text-gray-400 text-sm"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Apellido</label>
                <input 
                  type="text"
                  disabled={!isEditing}
                  className="w-full mt-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 disabled:text-gray-400 text-sm"
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">DNI (Obligatorio)</label>
              <input 
                type="text"
                disabled={!isEditing}
                className="w-full mt-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 disabled:text-gray-400 text-sm"
                value={formData.dni}
                onChange={e => setFormData({...formData, dni: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* Payment Methods - Only for Users */}
        {!state.isProMode && (
          <section className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Métodos de Pago</h2>
              <button 
                onClick={() => setShowAddCard(!showAddCard)}
                className="text-primary text-xs font-bold"
              >
                {showAddCard ? 'Cancelar' : 'Agregar'}
              </button>
            </div>

            <div className="space-y-3">
               {state.currentUser?.cards.map(card => (
                  <div key={card.id} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <div className="size-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-primary">credit_card</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">•••• •••• {card.number.slice(-4)}</p>
                      <p className="text-[10px] text-gray-500 font-medium">{card.brand} • Vence {card.expiry}</p>
                    </div>
                  </div>
               ))}

               {showAddCard && (
                 <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-4 animate-in slide-in-from-top duration-300">
                    <input 
                      type="text" 
                      placeholder="Número de tarjeta"
                      className="w-full bg-white dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-sm"
                      value={cardData.number}
                      onChange={e => setCardData({...cardData, number: e.target.value})}
                    />
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="MM/YY"
                        className="w-1/2 bg-white dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-sm"
                        value={cardData.expiry}
                        onChange={e => setCardData({...cardData, expiry: e.target.value})}
                      />
                      <button 
                        onClick={handleAddCard}
                        className="w-1/2 bg-primary text-white font-bold rounded-xl text-sm"
                      >
                        Guardar
                      </button>
                    </div>
                 </div>
               )}
            </div>
          </section>
        )}

        {/* AI Support Banner */}
        <button 
          onClick={() => navigate('/ai-support')}
          className="w-full flex items-center justify-between p-6 bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-3xl shadow-lg active:scale-95 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="size-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">smart_toy</span>
            </div>
            <div className="text-left">
              <p className="font-bold">Soporte con IA</p>
              <p className="text-[10px] opacity-80">Respuestas al instante</p>
            </div>
          </div>
          <span className="material-symbols-outlined">chevron_right</span>
        </button>

        {/* Mode Swap & Logout */}
        <div className="pt-4 space-y-3">
          <button 
            onClick={handleModeSwitch}
            className={`w-full flex items-center justify-center gap-3 p-5 rounded-3xl font-bold active:scale-95 transition-all ${
              state.isProMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
            }`}
          >
            <span className="material-symbols-outlined">{state.isProMode ? 'person' : 'work'}</span>
            {state.isProMode ? 'Cambiar a modo Usuario' : 'Cambiar a modo Profesional'}
          </button>

          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full text-red-500 font-bold py-4 text-sm"
          >
            Cerrar Sesión
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ProfileSettings;
