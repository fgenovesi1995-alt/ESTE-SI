import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useApp();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const msg = (location.state as any)?.message;

  const handleSubmit = async (role: 'user' | 'pro') => {
    if (!email.includes('@') || password.length < 6) {
      setError("Email inválido o contraseña muy corta (min 6 caracteres)");
      return;
    }

    if (isRegistering && !name) {
      setError("Ingresa tu nombre para registrarte");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        await register(email, password, role, name);
        // Supabase often logs in automatically, but might require email confirmation.
        // Assuming auto-login or immediate redirect.
      } else {
        await login(email, password);
      }
      navigate('/home');
    } catch (err: any) {
      setError(err.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-background-dark p-8">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">Arreglados 🔧</h1>
          <p className="text-gray-500">Servicios para el hogar en un clic</p>
        </div>

        {msg && (
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 p-4 rounded-2xl text-sm font-medium mb-6 text-center">
            {msg}
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-4 rounded-2xl text-sm font-medium mb-6 text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {isRegistering && (
            <input
              type="text"
              placeholder="Nombre Completo"
              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button
            disabled={loading}
            onClick={() => handleSubmit('user')}
            className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Cargando...' : (isRegistering ? 'Registrarse como Usuario' : 'Ingresar')}
          </button>

          <div className="relative py-4 flex items-center">
            <div className="flex-1 border-t border-gray-100 dark:border-gray-800"></div>
            <span className="px-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">o bien</span>
            <div className="flex-1 border-t border-gray-100 dark:border-gray-800"></div>
          </div>

          <button
            disabled={loading}
            onClick={() => handleSubmit('pro')}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">construction</span>
            {isRegistering ? 'Registrarse como Profesional' : 'Ingresar como Profesional'}
          </button>
        </div>

        <button
          onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
          className="mt-8 text-sm text-primary font-medium hover:underline"
        >
          {isRegistering ? '¿Ya tienes cuenta? Iniciar Sesión' : '¿No tienes cuenta? Crear una'}
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 pb-8">
        Al ingresar, aceptas nuestros Términos y Condiciones.
      </p>
    </div>
  );
};

export default Login;
