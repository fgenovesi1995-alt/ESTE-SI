import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BottomNav from '../components/BottomNav';
import LegalBanner from '../components/LegalBanner';
import { GoogleMap, useJsApiLoader, MarkerF, Autocomplete } from '@react-google-maps/api';
import { getGeocode, getLatLng } from 'use-places-autocomplete';
import { GOOGLE_MAPS_LIBRARIES } from '../services/googleMaps';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const CATEGORIES = ['Electricidad', 'Plomería', 'Gas', 'Aire Acondicionado', 'Carpintería', 'Herrería', 'Pintura', 'Limpieza', 'Jardinería', 'Cerrajería', 'Mudanzas', 'Electrónica'];

// Sub-component for the search logic to ensure hooks initialize only after script is loaded
interface AddressSearchProps {
  onSelect: (address: string) => void;
  onMapClick: (lat: number, lng: number) => void;
  location: { lat: number, lng: number } | null;
}

const AddressSearch: React.FC<AddressSearchProps> = ({ onSelect, onMapClick, location }) => {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState('');

  const onLoad = (autocompleteObj: google.maps.places.Autocomplete) => {
    console.log("Autocomplete widget loaded");
    setAutocomplete(autocompleteObj);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      console.log("Place Selected:", place);

      const address = place.formatted_address || place.name;
      if (address) {
        setInputValue(address);
        onSelect(address);
      }
    } else {
      console.log("Autocomplete is not loaded yet");
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Autocomplete
          onLoad={onLoad}
          onPlaceChanged={onPlaceChanged}
          options={{
            componentRestrictions: { country: "ar" },
            fields: ["address_components", "geometry", "formatted_address", "name"]
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-3 text-xs focus:ring-2 focus:ring-primary shadow-inner"
            placeholder="Busca tu dirección o barrio..."
          />
        </Autocomplete>
      </div>

      <div className="h-48 rounded-2xl overflow-hidden shadow-inner border border-gray-100 dark:border-gray-800">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={location || { lat: -34.6037, lng: -58.3816 }}
          zoom={location ? 16 : 12}
          onClick={(e) => {
            const lat = e.latLng?.lat();
            const lng = e.latLng?.lng();
            console.log("Map clicked at:", lat, lng);
            if (lat && lng) onMapClick(lat, lng);
          }}
          options={{
            disableDefaultUI: true,
            styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }]
          }}
        >
          {location && <MarkerF position={location} />}
        </GoogleMap>
      </div>
    </div>
  );
};

const CreateTask: React.FC = () => {
  const navigate = useNavigate();
  const { state, createTask } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [budget, setBudget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const handleSelect = async (address: string) => {
    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      setLocation({ lat, lng });
    } catch (error) {
      console.error("Error fetching coordinates", error);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.currentUser?.name || !state.currentUser?.lastName || !state.currentUser?.dni || !state.currentUser?.photo) {
      alert("⚠️ Perfil Incompleto\n\nDebes completar tus datos (Nombre, Apellido, DNI y Foto) en 'Mi Perfil' antes de publicar una tarea.");
      navigate('/profile');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTask(category, description, photo || undefined, location || undefined, budget ? parseFloat(budget) : undefined);
      navigate('/tasks');
    } catch (error) {
      console.error(error);
      alert("Error al crear la tarea. Intenta nuevamente.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full bg-background-light dark:bg-background-dark font-body flex flex-col overflow-hidden">
      <header className="p-6 pt-[env(safe-area-inset-top,24px)] bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
        <button onClick={() => navigate('/home')} className="p-1 -ml-2">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold flex-1 font-display">¿Qué necesitas?</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar">

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

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Presupuesto Estimado (Opcional)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
              <input
                type="number"
                className="w-full bg-white dark:bg-surface-dark border-none rounded-2xl py-4 pl-8 pr-4 text-sm focus:ring-2 focus:ring-primary shadow-sm"
                placeholder="Ej: 5000"
                value={budget}
                onChange={e => setBudget(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-gray-400 ml-1 italic">* Podrás negociar el precio final con el profesional en el chat.</p>
          </div>

          {/* Photo Section */}
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
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoSelect} />
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

          {/* Location Section */}
          <div className="p-4 bg-white dark:bg-surface-dark rounded-2xl shadow-sm space-y-4 relative">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <span className="text-sm font-bold">Ubicación del trabajo</span>
            </div>

            {isLoaded ? (
              <AddressSearch
                onSelect={handleSelect}
                onMapClick={(lat, lng) => setLocation({ lat, lng })}
                location={location}
              />
            ) : (
              <div className="h-48 bg-gray-50 dark:bg-gray-800 rounded-2xl animate-pulse flex items-center justify-center">
                <p className="text-[10px] text-gray-400">Cargando mapa...</p>
              </div>
            )}

            {location && (
              <p className="text-[10px] text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-center flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm text-green-500">check_circle</span>
                Ubicación confirmada
              </p>
            )}
          </div>

          <LegalBanner type="escrow" />
          <LegalBanner type="responsibility" />

          <button
            type="submit"
            disabled={isSubmitting || !category || !description || !location}
            className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95 transition-all mt-4"
          >
            {isSubmitting ? 'Publicando...' : 'Confirmar Pedido'}
          </button>
        </form>
      </main>

      <BottomNav />
    </div >
  );
};

export default CreateTask;
