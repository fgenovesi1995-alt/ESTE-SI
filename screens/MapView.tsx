
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { GOOGLE_MAPS_LIBRARIES } from '../services/googleMaps';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const containerStyle = {
  width: '100%',
  height: '100%'
};

const MapView: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useApp();
  const [coords, setCoords] = useState<{ lat: number, lng: number }>({ lat: -34.6037, lng: -58.3816 }); // Default BA
  const [selectedPro, setSelectedPro] = useState<any>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const CATEGORIES = ['Electricidad', 'Plomería', 'Pintura', 'Limpieza', 'Jardinería', 'Cerrajería', 'Mudanzas'];

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.log("Using default location (Buenos Aires)")
    );
  }, []);

  const filteredPros = selectedCategory
    ? state.professionals.filter(p => p.category === selectedCategory)
    : state.professionals;

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-4 pointer-events-none">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => navigate(-1)}
            className="size-12 bg-white dark:bg-surface-dark rounded-full shadow-lg flex items-center justify-center text-slate-900 dark:text-white pointer-events-auto active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="bg-white dark:bg-surface-dark px-4 py-2 rounded-full shadow-lg font-bold text-xs flex items-center gap-2 pointer-events-auto">
            <span className="material-symbols-outlined text-sm text-primary filled">location_on</span>
            {selectedCategory ? `${selectedCategory} cerca` : 'Profesionales cerca'}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-md transition-all ${selectedCategory === null
              ? 'bg-primary text-white scale-105'
              : 'bg-white dark:bg-surface-dark text-gray-600 dark:text-gray-300'
              }`}
          >
            Todos
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-md transition-all ${selectedCategory === cat
                ? 'bg-primary text-white scale-105'
                : 'bg-white dark:bg-surface-dark text-gray-600 dark:text-gray-300'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={coords}
            zoom={14}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              disableDefaultUI: true,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                }
              ]
            }}
          >
            {filteredPros.map((pro) => (
              <Marker
                key={pro.id}
                position={pro.location || { lat: coords.lat + (Math.random() - 0.5) * 0.01, lng: coords.lng + (Math.random() - 0.5) * 0.01 }}
                onClick={() => setSelectedPro(pro)}
              />
            ))}

            {selectedPro && (
              <InfoWindow
                position={selectedPro.location || { lat: coords.lat, lng: coords.lng }}
                onCloseClick={() => setSelectedPro(null)}
              >
                <div className="p-2 flex flex-col items-center min-w-[120px]" onClick={() => navigate(`/pro/${selectedPro.id}`)}>
                  <img src={selectedPro.photo} className="size-12 rounded-full object-cover mb-2 border-2 border-primary/20" />
                  <p className="text-xs font-bold text-gray-900">{selectedPro.name}</p>
                  <p className="text-[10px] text-primary font-bold tracking-tighter">{selectedPro.category}</p>
                  <button className="mt-2 text-[10px] bg-primary text-white px-3 py-1 rounded-full font-bold">Ver perfil</button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <div className="text-center p-10 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <p className="text-sm text-gray-500">Cargando mapa interactivo...</p>
          </div>
        )}

        {/* Floating helper UI */}
        {!selectedPro && isLoaded && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md p-6 rounded-3xl border border-white/50 text-center max-w-xs shadow-2xl pointer-events-none transition-all duration-500">
            <span className="material-symbols-outlined text-primary text-4xl mb-2 animate-bounce">explore</span>
            <h2 className="font-bold mb-1">Explorá la zona</h2>
            <p className="text-xs text-gray-500">Tocá los marcadores para ver a los profesionales de tu barrio.</p>
          </div>
        )}
      </div>

      <div className="p-6 bg-white dark:bg-surface-dark rounded-t-3xl shadow-2xl z-20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">{selectedCategory ? `${selectedCategory} recomendados` : 'Recomendados en la zona'}</h3>
          {filteredPros.length === 0 && <span className="text-[10px] text-red-500 font-bold">Sin resultados</span>}
        </div>
        <div className="flex overflow-x-auto gap-4 no-scrollbar">
          {filteredPros.length > 0 ? filteredPros.slice(0, 5).map(pro => (
            <button
              key={pro.id}
              onClick={() => {
                setCoords(pro.location || coords);
                setSelectedPro(pro);
              }}
              className="flex-shrink-0 w-48 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl flex items-center gap-3 border border-gray-100 dark:border-gray-700 active:scale-95 transition-all"
            >
              <img src={pro.photo} className="size-10 rounded-full object-cover" />
              <div className="text-left">
                <p className="text-xs font-bold truncate w-24">{pro.name}</p>
                <p className="text-[9px] text-primary font-bold tracking-tight">{pro.category}</p>
              </div>
            </button>
          )) : (
            <p className="text-xs text-gray-400 py-4 italic">No hay profesionales disponibles en esta categoría cerca tuyo.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;
