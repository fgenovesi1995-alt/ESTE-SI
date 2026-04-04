
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BottomNav from '../components/BottomNav';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import SlideToConfirm from '../components/SlideToConfirm';
import { motion, AnimatePresence } from 'framer-motion';

const TasksHistory: React.FC = () => {
  const navigate = useNavigate();
  const { state, createPaymentPreference, fetchTasks, finalizeTask, rateProfessional, rateUser } = useApp();

  const myTasks = state.isProMode
    ? state.tasks.filter(t => t.proId === state.currentUser?.id)
    : state.tasks.filter(t => t.userId === state.currentUser?.id);

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [reviewTask, setReviewTask] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showReviewSuccess, setShowReviewSuccess] = useState(false);
  const reviewInputRef = React.useRef<HTMLTextAreaElement>(null);

  const handlePayment = async (task: any) => {
    try {
      const amount = 500;
      const url = await createPaymentPreference(task.id, amount, `Pago por servicio: ${task.category}`);
      if (Capacitor.isNativePlatform()) {
        const listener = await Browser.addListener('browserFinished', () => {
          fetchTasks();
          listener.remove();
        });
        await Browser.open({ url, windowName: '_blank' });
      } else {
        window.open(url, '_blank');
        const handleFocus = () => {
          fetchTasks();
          window.removeEventListener('focus', handleFocus);
        };
        window.addEventListener('focus', handleFocus);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Buscando Pro', color: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50' };
      case 'accepted': return { label: 'En curso', color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' };
      case 'paid':
      case 'escrow': return { label: 'PAGADO', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' };
      case 'completed': return { label: 'Finalizado', color: 'bg-gray-400', text: 'text-gray-500', bg: 'bg-gray-50' };
      default: return { label: status, color: 'bg-gray-300', text: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark">
      <header className="p-6 pt-[env(safe-area-inset-top,24px)] bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/home')} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full active:scale-95">
            <span className="material-symbols-outlined text-gray-900 dark:text-white">arrow_back</span>
          </button>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            {state.isProMode ? 'Mis Trabajos' : 'Mis Pedidos'}
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-5 pb-32">
        <div className="space-y-6">
          {myTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="size-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-gray-300">history</span>
              </div>
              <p className="text-sm font-bold text-gray-400">No hay actividad registrada aún.</p>
            </div>
          ) : (
            myTasks.map(task => {
              const s = getStatusConfig(task.status);
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={task.id}
                  className="bg-white dark:bg-surface-dark rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-gray-800 active:scale-[0.99] transition-all"
                  onClick={() => setSelectedTask(task)}
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md inline-block self-start uppercase tracking-wider">
                        {task.category}
                      </span>
                      <p className="text-[10px] text-gray-400 font-bold mb-1">
                        {new Date(task.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </p>
                    </div>
                    <span className={`${s.bg} ${s.text} text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm border border-black/5`}>
                      {s.label}
                    </span>
                  </div>

                  {/* Body */}
                  <h3 className="text-lg font-black leading-tight text-gray-900 dark:text-white mb-4">
                    {task.description}
                  </h3>

                  {/* Interaction Info */}
                  <div className="flex items-center justify-between py-4 border-y border-gray-50 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                        <img
                          src={state.profiles.find(p => p.id === (state.isProMode ? task.userId : task.proId))?.photo || 'https://picsum.photos/seed/user/200'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                          {state.isProMode ? 'Cliente' : 'Profesional'}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/profile/${state.isProMode ? task.userId : task.proId}`); }}
                          className="text-xs font-black text-gray-900 dark:text-white hover:text-primary transition-colors"
                        >
                          {state.isProMode ? task.userName : (task.proName || 'Pendiente')}
                        </button>
                      </div>
                    </div>
                    {task.budget && (
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Presupuesto</p>
                        <p className="text-sm font-black text-primary">${task.budget.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-4 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                    {/* EN CURSO Actions */}
                    {task.status === 'accepted' && (
                      <div className="flex flex-col gap-3">
                        {!state.isProMode && (
                          <div className="flex items-start gap-2 bg-primary/5 p-3 rounded-2xl border border-primary/10">
                            <input type="checkbox" id={`chk-${task.id}`} className="mt-1 size-3 rounded border-gray-300 text-primary focus:ring-primary" />
                            <label htmlFor={`chk-${task.id}`} className="text-[9px] text-gray-500 leading-tight">
                              Acepto que Arreglados es solo un nexo técnico. El pago garantiza mi protección y garantía.
                            </label>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/chat/${state.isProMode ? task.userId : task.proId}`)}
                            className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white py-3 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 border border-gray-100 dark:border-gray-700 active:scale-95 transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">chat</span> CHAT
                          </button>
                          {!state.isProMode && (
                            <button
                              onClick={() => {
                                const cb = document.getElementById(`chk-${task.id}`) as HTMLInputElement;
                                if (!cb.checked) return alert("Aceptá la intermediación");
                                handlePayment(task);
                              }}
                              className="flex-[2] bg-primary text-white py-3 rounded-2xl text-[10px] font-black shadow-lg shadow-primary/20 active:scale-95 transition-all"
                            >
                              PAGAR CON GARANTÍA
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* PAID / ESCROW Actions */}
                    {(task.status === 'escrow' || task.status === 'paid') && (
                      <div className="flex flex-col gap-3">
                        {!state.isProMode ? (
                          <>
                            <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                              <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase mb-1">Dinero Protegido</p>
                              <p className="text-[9px] text-emerald-600/70 leading-tight">Deslizá solo cuando el trabajo esté finalizado y estés conforme.</p>
                            </div>
                            <SlideToConfirm
                              label="Deslizá para finalizar"
                              onConfirm={async () => {
                                if (window.confirm("¿Confirmás la recepción del servicio?")) {
                                  await finalizeTask(task.id);
                                  // Only show review modal if not already reviewed
                                  const hasReviewed = task.reviews?.some((r: any) => r.reviewerId === state.currentUser?.id);
                                  if (!hasReviewed) {
                                    setReviewTask(task);
                                  }
                                }
                              }}
                            />
                          </>
                        ) : (
                          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800">
                            <p className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase mb-2">¡PAGO LIBERADO!</p>
                            {/* Hide button if already reviewed */}
                            {!(task.reviews?.some((r: any) => r.reviewerId === state.currentUser?.id)) && (
                              <button
                                onClick={() => setReviewTask(task)}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black active:scale-95 transition-all"
                              >
                                RESEÑAR CLIENTE
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {/* COMPLETED Actions */}
                    {task.status === 'completed' && (
                      <div className="flex flex-col gap-3">
                        {!(task.reviews?.some((r: any) => r.reviewerId === state.currentUser?.id)) && (
                          <button
                            onClick={() => setReviewTask(task)}
                            className="w-full bg-primary/10 text-primary py-3 rounded-xl text-[10px] font-black active:scale-95 transition-all border border-primary/20"
                          >
                            DEJAR RESEÑA
                          </button>
                        )}
                        <p className="text-[9px] text-gray-400 text-center font-bold uppercase tracking-widest">Trabajo Finalizado</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </main>

      <BottomNav />

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end justify-center p-4"
            onClick={() => setSelectedTask(null)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-[40px] p-8 shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md inline-block uppercase tracking-wider mb-2">
                    {selectedTask.category}
                  </span>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{selectedTask.description}</h2>
                </div>
                <button onClick={() => setSelectedTask(null)} className="size-10 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar pb-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-3xl">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estado</p>
                    <p className="text-sm font-black text-primary uppercase">{selectedTask.status}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-3xl">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">ID Tarea</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white uppercase">#{selectedTask.id.slice(0, 6)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase mb-4 tracking-widest">Fotos Adjuntas</h3>
                  {selectedTask.photo ? (
                    <img src={selectedTask.photo} className="w-full h-48 object-cover rounded-3xl shadow-sm" />
                  ) : (
                    <div className="w-full h-48 bg-gray-50 dark:bg-gray-800/50 rounded-3xl flex flex-col items-center justify-center text-gray-300">
                      <span className="material-symbols-outlined text-4xl mb-2">image_not_supported</span>
                      <p className="text-[10px] font-bold uppercase">Sin fotos</p>
                    </div>
                  )}
                </div>

                <div className="pb-8">
                  <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase mb-2 tracking-widest">Ubicación</h3>
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <p className="text-xs font-bold">{selectedTask.location ? `${selectedTask.location.lat.toFixed(4)}, ${selectedTask.location.lng.toFixed(4)}` : 'No disponible'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewTask && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-[48px] p-8 shadow-2xl text-center"
            >
              {!showReviewSuccess ? (
                <>
                  <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-4xl text-primary">verified</span>
                  </div>
                  <h2 className="text-2xl font-black mb-2">¡Misión Cumplida!</h2>
                  <p className="text-xs text-gray-500 mb-8">
                    Calificá a <span className="text-primary font-bold">{state.isProMode ? reviewTask.userName : reviewTask.proName}</span> para ayudar a la comunidad.
                  </p>

                  <div className="flex justify-center gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => setRating(star)} className="active:scale-125 transition-transform">
                        <span className={`material-symbols-outlined text-4xl ${rating >= star ? 'text-yellow-500 filled' : 'text-gray-200'}`}>star</span>
                      </button>
                    ))}
                  </div>

                  <textarea
                    ref={reviewInputRef}
                    placeholder="Contanos más sobre el servicio..."
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-3xl p-4 text-sm mb-6 h-28 resize-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />

                  <button
                    disabled={rating === 0 || isSubmittingReview}
                    onClick={async () => {
                      setIsSubmittingReview(true);
                      if (Capacitor.isNativePlatform()) await Keyboard.hide();
                      try {
                        if (state.isProMode) await rateUser(reviewTask.id, reviewTask.userId, rating, comment);
                        else await rateProfessional(reviewTask.id, reviewTask.proId, rating, comment);
                        setShowReviewSuccess(true);
                      } catch (e) {
                        console.error(e);
                        alert("Error al enviar reseña");
                      } finally {
                        setIsSubmittingReview(false);
                        fetchTasks();
                      }
                    }}
                    className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95 transition-all uppercase tracking-widest text-xs"
                  >
                    {isSubmittingReview ? 'Enviando...' : 'FINALIZAR Y ENVIAR'}
                  </button>
                </>
              ) : (
                <div className="py-10">
                  <div className="size-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                    <span className="material-symbols-outlined text-4xl text-white">done_all</span>
                  </div>
                  <h2 className="text-2xl font-black mb-4">¡Muchas gracias!</h2>
                  <button
                    onClick={() => { setReviewTask(null); setShowReviewSuccess(false); setRating(0); setComment(''); }}
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black py-4 rounded-2xl uppercase tracking-widest text-xs active:scale-95 transition-all"
                  >
                    CERRAR
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TasksHistory;
