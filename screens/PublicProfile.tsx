
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const PublicProfile: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state, fetchReviews } = useApp();

    // Find either a professional or a general user profile
    const profile = state.profiles.find(p => p.id === id) || state.professionals.find(p => p.id === id);
    const userReviews = state.reviews.filter(r => r.reviewedId === id);

    useEffect(() => {
        if (id) {
            fetchReviews(id);
        }
    }, [id]);

    if (!profile) return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
            <div className="text-center">
                <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">person_off</span>
                <p className="text-gray-500 font-bold">Perfil no encontrado</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-primary font-black">VOLVER</button>
            </div>
        </div>
    );

    const averageRating = userReviews.length > 0
        ? (userReviews.reduce((acc, r) => acc + r.rating, 0) / userReviews.length).toFixed(1)
        : (profile as any).rating || '0.0';

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
            <header className="p-6 pt-[env(safe-area-inset-top,24px)] bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 sticky top-0 z-50">
                <button onClick={() => navigate(-1)} className="p-1 -ml-2">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-black flex-1 uppercase tracking-widest">Perfil Público</h1>
            </header>

            <div className="px-6 py-8">
                {/* Profile Card */}
                <div className="bg-white dark:bg-surface-dark rounded-[40px] p-8 shadow-xl border border-gray-100 dark:border-gray-800 text-center mb-8">
                    <div className="size-32 rounded-full overflow-hidden border-4 border-primary/20 mx-auto mb-6 shadow-2xl">
                        <img src={profile.photo || 'https://picsum.photos/seed/user/200'} className="w-full h-full object-cover" />
                    </div>

                    <h2 className="text-2xl font-black mb-1">{profile.name}</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
                        {(profile as any).role === 'pro' ? ((profile as any).category || 'Profesional') : 'Usuario Arreglados'}
                    </p>

                    <div className="flex justify-center items-center gap-8 border-t border-gray-50 dark:border-gray-800 pt-6">
                        <div className="text-center">
                            <div className="flex items-center gap-1 justify-center mb-1">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">{averageRating}</span>
                                <span className="material-symbols-outlined text-yellow-500 filled flex">star</span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Promedio</p>
                        </div>
                        <div className="w-px h-10 bg-gray-100 dark:bg-gray-800"></div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-slate-900 dark:text-white mb-1">{userReviews.length}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Reseñas</p>
                        </div>
                    </div>
                </div>

                {/* Reviews List */}
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-4">Lo que dicen otros</h3>

                <div className="space-y-4">
                    {userReviews.length === 0 ? (
                        <div className="bg-white dark:bg-surface-dark rounded-3xl p-10 text-center border border-dashed border-gray-200 dark:border-gray-800">
                            <span className="material-symbols-outlined text-4xl text-gray-200 mb-2">rate_review</span>
                            <p className="text-xs text-gray-400">Sin reseñas por el momento.</p>
                        </div>
                    ) : (
                        userReviews.slice().reverse().map(review => (
                            <div key={review.id} className="bg-white dark:bg-surface-dark p-6 rounded-[32px] shadow-sm border border-gray-50 dark:border-gray-800 animate-in slide-in-from-bottom duration-500">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <span key={star} className={`material-symbols-outlined text-sm ${review.rating >= star ? 'text-yellow-500 filled' : 'text-gray-200'}`}>
                                                star
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase italic">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                                    "{review.comment || 'Sin comentario'}"
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="fixed bottom-8 left-6 right-6 z-10">
                <button
                    onClick={() => navigate(`/chat/${profile.id}`)}
                    className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined">chat</span>
                    ENVIAR MENSAJE
                </button>
            </div>
        </div>
    );
};

export default PublicProfile;
