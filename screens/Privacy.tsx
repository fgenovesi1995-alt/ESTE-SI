import React from 'react';
import { useNavigate } from 'react-router-dom';

const Privacy: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white dark:bg-background-dark text-slate-900 dark:text-white pb-20">
            <header className="p-6 pt-[env(safe-area-inset-top,24px)] bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="p-1 -ml-2">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold flex-1">Política de Privacidad</h1>
            </header>

            <main className="p-6 max-w-2xl mx-auto space-y-8 leading-relaxed">
                <section>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">shield</span>
                        Introducción
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        En **Arreglados**, valoramos y protegemos la privacidad de nuestros usuarios. Esta política describe cómo recolectamos, usamos y resguardamos la información personal que nos brindas al utilizar nuestra plataforma para conectar con profesionales de servicios para el hogar.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">inventory_2</span>
                        Datos que Recolectamos
                    </h2>
                    <ul className="list-disc ml-4 text-sm text-gray-600 dark:text-gray-400 space-y-2">
                        <li>**Información de Registro:** Nombre, correo electrónico, DNI (opcional para usuarios, requerido para profesionales) y foto de perfil.</li>
                        <li>**Ubicación:** Recolectamos datos de geolocalización para mostrarte profesionales cercanos y permitir la creación de tareas en el mapa.</li>
                        <li>**Mensajería:** Almacenamos tus mensajes en el chat para permitir la comunicación entre usuarios y profesionales sobre los servicios solicitados.</li>
                        <li>**Información de Pagos:** No almacenamos datos de tarjetas directamente. Los pagos se procesan de forma segura a través de **Mercado Pago**.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">visibility</span>
                        Uso de la Información
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Utilizamos tus datos exclusivamente para:
                    </p>
                    <ul className="list-disc ml-4 text-sm text-gray-600 dark:text-gray-400 space-y-2 mt-2">
                        <li>Conectar clientes con profesionales calificados.</li>
                        <li>Facilitar la gestión de pagos y seguimiento de tareas.</li>
                        <li>Brindar soporte técnico a través de nuestro asistente con IA.</li>
                        <li>Enviar notificaciones importantes sobre el estado de tus pedidos.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">share</span>
                        Compartir Información
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Solo compartimos los datos necesarios (nombre, ubicación del servicio y chat) entre las dos partes involucradas en una tarea. No vendemos ni cedemos tus datos a terceros con fines publicitarios.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">delete_forever</span>
                        Eliminación de Datos
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Puedes solicitar la eliminación de tu cuenta y todos tus datos personales asociados en cualquier momento desde la configuración de tu perfil o enviando un correo a soporte@arreglados.com.ar.
                    </p>
                </section>

                <footer className="pt-10 text-center opacity-50">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em]">© 2026 Arreglados - Argentina</p>
                    <p className="text-[10px] mt-1">Última actualización: Marzo 2026</p>
                </footer>
            </main>
        </div>
    );
};

export default Privacy;
