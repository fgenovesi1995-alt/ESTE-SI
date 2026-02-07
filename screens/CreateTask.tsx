import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

const CATEGORIES = ['Electricidad', 'Plomería', 'Pintura', 'Limpieza', 'Jardinería', 'Cerrajería', 'Mudanzas'];

const CreateTask: React.FC = () => {
  const navigate = useNavigate();
  const { createTask } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description) return;

    setIsSubmitting(true);
    try {
      await createTask(category, description, photo || undefined);
      navigate('/tasks');
    } catch (error) {
      console.error(error);
      alert("Error al crear la tarea. Intenta nuevamente.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
      <Header />

      <main className="p-6">
        <h1 className="text-2xl font-bold mb-6">¿Qué necesitas?</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Tipo de Servicio</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all border-2 ${category === cat
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-transparent bg-white dark:bg-surface-dark shadow-sm'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Descripción del problema</label>
            <textarea
              required
              className="w-full h-32 bg-white dark:bg-surface-dark border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary shadow-sm"
              placeholder="Ej: El enchufe del living hace chispas..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="p-4 bg-white dark:bg-surface-dark rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">photo_camera</span>
                <span className="text-sm font-bold">Evidencia visual</span>
              </div>
              {photo && (
                <button type="button" onClick={() => setPhoto(null)} className="text-red-500 text-xs font-bold">Quitar</button>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
              />

              {photo ? (
                <div className="size-20 rounded-2xl overflow-hidden border-2 border-primary/20">
                  <img src={photo} className="w-full h-full object-cover" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="size-20 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-gray-400">add</span>
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !category || !description}
            className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95 transition-all"
          >
            {isSubmitting ? 'Publicando...' : 'Confirmar Pedido'}
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
};

export default CreateTask;
