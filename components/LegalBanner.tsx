
import React from 'react';

interface LegalBannerProps {
  type: 'intermediary' | 'escrow' | 'responsibility';
}

const LegalBanner: React.FC<LegalBannerProps> = ({ type }) => {
  const content = {
    intermediary: {
      icon: 'gavel',
      title: 'Transparencia Arreglados',
      text: 'Arreglados es un facilitador tecnológico que solo facilita el contacto. No somos empleadores ni contratistas de los profesionales.'
    },
    escrow: {
      icon: 'shield_lock',
      title: 'Protección de Fondos',
      text: 'Tu pago queda bajo custodia (Escrow) y solo se libera cuando confirmás que el trabajo finalizó satisfactoriamente.'
    },
    responsibility: {
      icon: 'report_problem',
      title: 'Responsabilidad Civil',
      text: 'La ejecución técnica, garantías de obra y responsabilidad civil corresponden 100% al profesional independiente contratado.'
    }
  }[type];

  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex gap-3 my-4">
      <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-sm text-slate-600 dark:text-slate-300">{content.icon}</span>
      </div>
      <div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{content.title}</h4>
        <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-400 italic">
          "{content.text}"
        </p>
      </div>
    </div>
  );
};

export default LegalBanner;
