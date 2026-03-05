
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAIResponse } from '../services/geminiService';

interface ChatBubble {
  role: 'user' | 'ai';
  text: string;
}

const AISupport: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatBubble[]>([
    { role: 'ai', text: "¡Hola! Soy tu asistente de Arreglados. ¿En qué te puedo ayudar hoy? Che, contame lo que necesites." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    console.log("[AISupport] Sending message to Gemini:", userMsg);
    const response = await getAIResponse(userMsg);
    console.log("[AISupport] Received response from Gemini");
    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-indigo-50 dark:bg-background-dark overflow-hidden">
      <header className="bg-white dark:bg-surface-dark p-4 pt-[env(safe-area-inset-top,24px)] flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
        <button onClick={() => navigate(-1)} className="p-1">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="size-10 bg-indigo-600 rounded-full flex items-center justify-center text-white">
          <span className="material-symbols-outlined">smart_toy</span>
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-sm leading-none mb-1">Asistente Arreglados</h2>
          <p className="text-[10px] text-green-500 font-bold">En línea</p>
        </div>
        <button
          onClick={() => setMessages([{ role: 'ai', text: "¡Hola! Soy tu asistente de Arreglados. ¿En qué te puedo ayudar hoy? Che, contame lo que necesites." }])}
          className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors flex flex-col items-center gap-0.5"
        >
          <span className="material-symbols-outlined text-sm">delete_sweep</span>
          Limpiar
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm ${m.role === 'user'
              ? 'bg-indigo-600 text-white rounded-br-none'
              : 'bg-white dark:bg-surface-dark text-gray-800 dark:text-gray-100 rounded-bl-none'
              }`}>
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-surface-dark px-4 py-3 rounded-2xl shadow-sm rounded-bl-none">
              <div className="flex gap-1">
                <div className="size-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="size-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                <div className="size-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="¿Cómo contrato a un plomero?"
            className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            value={input}
            disabled={isLoading}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="size-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-50"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISupport;
