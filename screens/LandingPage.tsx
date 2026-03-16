import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const handleStart = (role: 'user' | 'pro' = 'user') => {
        navigate('/login', { state: { role } });
    };

    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const staggerContainer = {
        animate: {
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 overflow-x-hidden">

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-md mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🔧</span>
                        <span className="font-bold text-xl text-primary">Arreglados</span>
                    </div>
                    <button
                        onClick={() => handleStart()}
                        className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
                    >
                        Ingresar
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 max-w-md mx-auto relative">
                <div className="absolute top-20 right-0 -z-10 opacity-20 dark:opacity-10 animate-pulse">
                    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="100" cy="100" r="100" fill="#137fec" />
                    </svg>
                </div>

                <motion.div
                    initial="initial"
                    animate="animate"
                    variants={staggerContainer}
                    className="text-center"
                >
                    <motion.h1
                        variants={fadeInUp}
                        className="text-5xl font-extrabold leading-tight mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent"
                    >
                        Tu hogar, en las <span className="text-primary">mejores manos</span>.
                    </motion.h1>

                    <motion.p
                        variants={fadeInUp}
                        className="text-lg text-gray-500 dark:text-gray-400 mb-10 leading-relaxed"
                    >
                        Encontrá profesionales recomendados para reparaciones y mantenimiento en cuestión de minutos.
                    </motion.p>

                    <motion.div
                        variants={fadeInUp}
                        className="flex flex-col gap-4"
                    >
                        <button
                            onClick={() => handleStart('user')}
                            className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-all text-lg flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">search</span>
                            Buscar Profesional
                        </button>

                        <button
                            onClick={() => handleStart('pro')}
                            className="w-full bg-white dark:bg-surface-dark text-slate-700 dark:text-slate-200 font-bold py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 hover:border-primary/30"
                        >
                            <span className="material-symbols-outlined">construction</span>
                            Soy Profesional
                        </button>
                    </motion.div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gray-50 dark:bg-surface-dark/50">
                <div className="max-w-md mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="space-y-12"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-primary">
                                <span className="material-symbols-outlined text-3xl">groups</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Comunidad Confiable</h3>
                                <p className="text-gray-500 text-sm">Basamos la confianza en las reseñas de otros usuarios. Mirá fotos de trabajos reales y elegí al mejor.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl text-green-600">
                                <span className="material-symbols-outlined text-3xl">rocket_launch</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Rápido y Fácil</h3>
                                <p className="text-gray-500 text-sm">Publicá lo que necesitás, recibí ofertas por chat y coordiná la visita en el acto.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl text-purple-600">
                                <span className="material-symbols-outlined text-3xl">payments</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Pago contra entrega</h3>
                                <p className="text-gray-500 text-sm">Pagás recién cuando el trabajo esté terminado. Sin adelantos riesgosos ni sorpresas.</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20 max-w-md mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold mb-12">¿Cómo funciona?</h2>

                <div className="relative">
                    {/* Connecting Line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-100 dark:bg-gray-800 -z-10 transform -translate-x-1/2"></div>

                    <div className="space-y-12">
                        <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 relative">
                            <span className="text-4xl mb-4 block">📸</span>
                            <h3 className="font-bold text-lg">1. Publicá o Buscá</h3>
                            <p className="text-sm text-gray-500">Subí una foto de lo que falla o buscá directamente por categorías al profesional que necesitás.</p>
                        </div>

                        <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 relative">
                            <span className="text-4xl mb-4 block">💬</span>
                            <h3 className="font-bold text-lg">2. Chateá</h3>
                            <p className="text-sm text-gray-500">Sacate las dudas, pedí un presupuesto estimado y coordiná día y horario.</p>
                        </div>

                        <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 relative">
                            <span className="text-4xl mb-4 block">🤝</span>
                            <h3 className="font-bold text-lg">3. Solucioná</h3>
                            <p className="text-sm text-gray-500">Recibí al profesional, confirmá el arreglo y pagá de forma segura.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Bottom */}
            <section className="pb-20 px-6 max-w-md mx-auto">
                <div className="bg-slate-900 text-white rounded-3xl p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 size-32 bg-primary/20 blur-3xl rounded-full"></div>
                    <div className="absolute bottom-0 left-0 size-32 bg-blue-500/20 blur-3xl rounded-full"></div>

                    <h2 className="text-2xl font-bold mb-4 relative z-10">¿Listo para arreglarlo?</h2>
                    <p className="text-gray-400 mb-8 text-sm relative z-10">Unite a la comunidad de soluciones para el hogar más grande de Argentina.</p>

                    <button
                        onClick={() => handleStart('user')}
                        className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all relative z-10"
                    >
                        Empezar Ahora
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 text-center text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800">
                <p>&copy; 2024 Arreglados. Todos los derechos reservados.</p>
            </footer>

        </div>
    );
};

export default LandingPage;
