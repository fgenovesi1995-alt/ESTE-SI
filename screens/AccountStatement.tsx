
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const AccountStatement: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useApp();
  const user = state.currentUser;

  // Manual calculation of balance if not yet in state (or use existing earnings as fallback)
  const balance = (user as any)?.current_balance || 0;
  const isDeudor = balance < 0;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
      <header className="p-6 pt-[env(safe-area-inset-top,24px)] bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-1 -ml-2">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold flex-1 text-slate-900 dark:text-white">Estado de Cuenta</h1>
      </header>

      <main className="p-6 space-y-6">
        {/* Balance Card */}
        <div className={`p-8 rounded-[2.5rem] shadow-xl ${isDeudor ? 'bg-red-600' : 'bg-slate-900'} text-white relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined text-9xl">account_balance_wallet</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Saldo Disponible</p>
          <h2 className="text-4xl font-black mb-4">${balance.toLocaleString()}</h2>
          {isDeudor && (
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
              <p className="text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">warning</span>
                ALERTA DE DEUDA
              </p>
              <p className="text-[10px] opacity-90 mt-1 leading-tight">
                Tenés un saldo negativo. El 100% de tus próximos ingresos se destinarán automáticamente a saldar esta deuda con el cliente afectado.
              </p>
            </div>
          )}
        </div>

        {/* Protection Fee Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-3xl border border-blue-100 dark:border-blue-800 flex gap-4">
          <div className="size-12 bg-primary rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
             <span className="material-symbols-outlined">security</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">Costo de Protección y Garantía</h4>
            <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-snug">
              Se aplica una comisión del 5% a cada trabajo para garantizar la seguridad de la intermediación y el sistema de escrow.
            </p>
          </div>
        </div>

        {/* Payout Policy */}
        <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 mb-4">Políticas de Cobro</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Plazo de Liberación</p>
                <p className="text-[10px] text-gray-500">{user?.role === 'pro' && (user as any).isPremium ? 'Premium: 24h hábiles' : 'Estándar: 48h hábiles'}</p>
              </div>
              <span className="material-symbols-outlined text-gray-300">schedule</span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800">
              <div>
                <p className="text-sm font-bold">Método de Pago</p>
                <p className="text-[10px] text-gray-500">Transferencia Bancaria (CBU/Alias)</p>
              </div>
              <span className="material-symbols-outlined text-gray-300">account_balance</span>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
           <h3 className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-2">
             <span className="material-symbols-outlined text-sm">gavel</span>
             NATURALEZA JURÍDICA
           </h3>
           <p className="text-[9px] text-gray-400 leading-relaxed italic">
             "Arreglados" es un facilitador tecnológico. Al usar la plataforma, aceptás que la app no garantiza el resultado técnico ni estético del trabajo, actuando solo como intermediario y gestor de reputación. La responsabilidad técnica y civil es 100% del profesional independiente.
           </p>
        </div>
      </main>
    </div>
  );
};

export default AccountStatement;
