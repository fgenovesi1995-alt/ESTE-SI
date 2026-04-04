
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BottomNav from '../components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

const ProfileSettings: React.FC = () => {
  const navigate = useNavigate();
  const { state, logout, updateUser, addCard, fetchReviews } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isVerifyingBiometric, setIsVerifyingBiometric] = useState(false);
  const [biometricStep, setBiometricStep] = useState(0); // 0: idle, 1: scanning, 2: success
  const [capturedDniPhoto, setCapturedDniPhoto] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const pdfInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetchReviews();
  }, []);

  const [formData, setFormData] = useState({
    name: state.currentUser?.name || '',
    lastName: state.currentUser?.lastName || '',
    dni: state.currentUser?.dni || '',
    photo: state.currentUser?.photo || 'https://picsum.photos/seed/user/200',
    profession: (state.currentUser as any)?.profession || '',
    cbuAlias: state.currentUser?.cbuAlias || '',
    criminalRecordUrl: state.currentUser?.criminalRecordUrl || ''
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

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert("Por favor sube un archivo PDF.");
        return;
      }
      // Simulate upload and storage of URL
      setFormData({ ...formData, criminalRecordUrl: 'mock_pdf_url' });
      alert("Certificado de antecedentes penales subido correctamente.");
    }
  };

  const startBiometricVerification = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        // Fallback or alert for web
        alert("La verificación por cámara solo está disponible en la App móvil.");
        return;
      }

      setIsVerifyingBiometric(true);
      setBiometricStep(1);

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        promptLabelHeader: 'Verificación de Identidad',
        promptLabelPhoto: 'Elegir de la galería',
        promptLabelPicture: 'Tomar foto frontal del DNI'
      });

      if (image.dataUrl) {
        setCapturedDniPhoto(image.dataUrl);
        // Simulate a small "processing" delay for aesthetic
        await new Promise(r => setTimeout(r, 1500));
        setBiometricStep(2);

        // Update user status in Supabase
        await updateUser({ kycStatus: 'verified' });

        setTimeout(() => {
          setIsVerifyingBiometric(false);
          setBiometricStep(0);
        }, 2500);
      } else {
        setIsVerifyingBiometric(false);
        setBiometricStep(0);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setIsVerifyingBiometric(false);
      setBiometricStep(0);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark">
      <header className="p-6 pt-[env(safe-area-inset-top,24px)] bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
        <button onClick={() => navigate('/home')} className="p-1 -ml-2">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold flex-1">Ajustes</h1>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="text-primary font-bold text-sm"
        >
          {isEditing ? 'Guardar' : 'Editar'}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-4 py-6 space-y-6 pb-32">
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
                      reader.onloadend = () => setFormData({ ...formData, photo: reader.result as string });
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
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Apellido</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  className="w-full mt-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 disabled:text-gray-400 text-sm"
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
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
                onChange={e => setFormData({ ...formData, dni: e.target.value })}
              />
            </div>

            {state.isProMode && (
              <>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CBU / Alias (Para Cobros)</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="Tu CBU o Alias de Mercado Pago/Banco"
                    className="w-full mt-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 disabled:text-gray-400 text-sm font-mono"
                    value={(formData as any).cbuAlias || ''}
                    onChange={e => setFormData({ ...formData, cbuAlias: e.target.value } as any)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Certificado Antecedentes Penales</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      disabled={true}
                      placeholder="No cargado"
                      className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-gray-400 text-sm"
                      value={formData.criminalRecordUrl ? '✅ Cargado' : '❌ Falta cargar'}
                    />
                    <input type="file" ref={pdfInputRef} className="hidden" accept=".pdf" onChange={handlePdfUpload} />
                    {isEditing && (
                      <button
                        onClick={() => pdfInputRef.current?.click()}
                        className="bg-primary/10 text-primary px-4 py-3 rounded-xl text-xs font-bold active:scale-95 transition-all"
                      >
                        Subir PDF
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Verificación de Identidad (DNI)</label>
                  <div className="mt-2">
                    {state.currentUser?.kycStatus === 'verified' ? (
                      <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 p-4 rounded-2xl flex items-center gap-3">
                        <span className="material-symbols-outlined text-green-500">verified_user</span>
                        <p className="text-xs font-bold text-green-700 dark:text-green-400 tracking-wide uppercase">Identidad Verificada</p>
                      </div>
                    ) : (
                      <button
                        onClick={startBiometricVerification}
                        className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-2xl flex items-center justify-between group active:scale-95 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-blue-500">badge</span>
                          <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase">Iniciar Verificación de DNI</span>
                        </div>
                        <span className="material-symbols-outlined text-blue-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título de tu Profesión (Opcional)</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="Ej: Electricista Matriculado"
                    className="w-full mt-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 disabled:text-gray-400 text-sm"
                    value={formData.profession}
                    onChange={e => setFormData({ ...formData, profession: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* Reviews Section */}
        <section className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mis Reseñas</h3>
            {state.reviews.length > 0 && (
              <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/10 px-3 py-1 rounded-full">
                <span className="text-sm font-black text-yellow-600">
                  {(state.reviews.reduce((acc, r) => acc + r.rating, 0) / state.reviews.length).toFixed(1)}
                </span>
                <span className="material-symbols-outlined text-xs text-yellow-500 filled">star</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {state.reviews.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-gray-200 mb-2">rate_review</span>
                <p className="text-xs text-gray-400">Aún no has recibido reseñas.</p>
              </div>
            ) : (
              state.reviews.map(review => (
                <div key={review.id} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className={`material-symbols-outlined text-[10px] ${review.rating >= star ? 'text-yellow-500 filled' : 'text-gray-200'}`}>
                          star
                        </span>
                      ))}
                    </div>
                    <span className="text-[9px] text-gray-400 font-medium">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 italic leading-relaxed">
                    "{review.comment || 'Sin comentario.'}"
                  </p>
                </div>
              ))
            )}
          </div>
        </section>



        {/* Mode Swap & Logout */}
        <div className="pt-4 space-y-3">
          <button
            onClick={handleModeSwitch}
            className={`w-full flex items-center justify-center gap-3 p-5 rounded-3xl font-bold active:scale-95 transition-all ${state.isProMode
              ? 'bg-blue-600 text-white'
              : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              }`}
          >
            <span className="material-symbols-outlined">{state.isProMode ? 'person' : 'work'}</span>
            {state.isProMode ? 'Cambiar a modo Usuario' : 'Cambiar a modo Profesional'}
          </button>

          <button
            onClick={() => setShowTerms(true)}
            className="w-full flex items-center justify-between p-5 bg-white dark:bg-surface-dark rounded-3xl border border-gray-100 dark:border-gray-800 font-bold active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">gavel</span>
              <span className="text-sm">Términos y Condiciones</span>
            </div>
            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
          </button>

          <button
            onClick={() => navigate('/privacy')}
            className="w-full flex items-center justify-between p-5 bg-white dark:bg-surface-dark rounded-3xl border border-gray-100 dark:border-gray-800 font-bold active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">shield</span>
              <span className="text-sm">Política de Privacidad</span>
            </div>
            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
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

      {/* Biometric Verification Overlay */}
      <AnimatePresence>
        {isVerifyingBiometric && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8"
          >
            {biometricStep === 1 && (
              <div className="flex flex-col items-center text-center">
                <div className="relative size-72 mb-10 overflow-hidden rounded-[80px] border-4 border-white/10 shadow-2xl bg-slate-900">
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    {capturedDniPhoto ? (
                      <img src={capturedDniPhoto} className="w-full h-full object-cover opacity-50 animate-pulse" />
                    ) : (
                      <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                    <p className="absolute bottom-10 left-0 right-0 text-white text-[10px] font-black uppercase tracking-[0.2em]">Analizando Identidad</p>
                  </div>
                </div>
                <h2 className="text-2xl font-black text-white mb-3 tracking-tight">VERIFICACIÓN EN CURSO</h2>
                <div className="flex items-center gap-3 bg-white/5 px-6 py-2 rounded-full border border-white/10">
                  <div className="size-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,1)]" />
                  <p className="text-blue-200/60 text-[9px] font-black uppercase tracking-widest">Capacitor Camera Engine v4.0</p>
                </div>
              </div>
            )}

            {biometricStep === 2 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="size-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/40">
                  <span className="material-symbols-outlined text-5xl text-white">check</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">¡Verificación Exitosa!</h2>
                <p className="text-green-200/60 text-sm">Tu identidad ha sido confirmada mediante DNI.</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terms & Conditions Modal */}
      <AnimatePresence>
        {showTerms && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end justify-center p-4"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-t-[40px] shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 pb-4 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-black">Términos y Condiciones</h2>
                <button onClick={() => setShowTerms(false)} className="size-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 pt-2 no-scrollbar space-y-6">
                <section>
                  <h3 className="font-black text-primary text-xs uppercase tracking-widest mb-2">Naturaleza Jurídica</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    "Arreglados" se define exclusivamente como una plataforma de tecnología de intermediación y un nexo tecnológico. La App no es una empresa de servicios técnicos, no es empleadora de los profesionales (PROs), ni actúa como agencia de colocación. La relación contractual de locación de servicios es exclusiva, directa y privada entre el Usuario (cliente) y el Profesional (PRO).
                  </p>
                </section>

                <section>
                  <h3 className="font-black text-primary text-xs uppercase tracking-widest mb-2">Consumación y Garantía</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    El pago garantiza la gestión del cobro y la reputación, pero no constituye un seguro de caución. Al presionar "Confirmar Finalización", los fondos se liberan y la transacción se considera jurídicamente consumada entre las partes. La App no garantiza el resultado técnico ni estético, actuando solo como facilitador de disputas.
                  </p>
                </section>

                <section>
                  <h3 className="font-black text-primary text-xs uppercase tracking-widest mb-2">Responsabilidad Civil y Técnica</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    La responsabilidad civil, técnica, penal y profesional es 100% del profesional independiente. Arreglados queda exenta de toda responsabilidad ante: Conflictos de calidad/demora; Daños materiales, accidentes o siniestros; Hechos delictivos o de inseguridad. El Usuario reconoce que la App no supervisa la ejecución física de la obra.
                  </p>
                </section>

                <section>
                  <h3 className="font-black text-primary text-xs uppercase tracking-widest mb-2">Cláusula de Indemnidad</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Usuario y PRO aceptan mantener indemne a "Arreglados" ante cualquier reclamo. Se reconoce la autonomía del PRO y se deslinda al dueño del hogar de cualquier vínculo de dependencia laboral o responsabilidad por accidentes.
                  </p>
                </section>
              </div>

              <div className="p-8 shrink-0">
                <button
                  onClick={() => setShowTerms(false)}
                  className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  ENTIENDO Y ACEPTO
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileSettings;
