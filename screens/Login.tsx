import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useApp();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [dni, setDni] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const msg = (location.state as any)?.message;

  const handleSubmit = async (role: 'user' | 'pro') => {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail.includes('@') || cleanPassword.length < 6) {
      setError("Email inválido o contraseña muy corta (min 6 caracteres)");
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (isRegistering && !name.trim()) {
      setError("Ingresa tu nombre para registrarte");
      return;
    }

    if (isRegistering && !dni.trim()) {
      setError("El DNI es obligatorio para registrarte");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        await register(cleanEmail, cleanPassword, role, name.trim(), dni.trim());
        setError("¡Registro exitoso! Por favor, verifica tu email antes de ingresar.");
        setIsRegistering(false);
      } else {
        await login(cleanEmail, cleanPassword);
        navigate('/home');
      }
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
            <>
              <input
                type="text"
                placeholder="Nombre Completo"
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <input
                type="text"
                placeholder="DNI (Número de documento)"
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary"
                value={dni}
                onChange={e => setDni(e.target.value)}
              />
            </>
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

          {isRegistering && (
            <input
              type="password"
              placeholder="Confirmar Contraseña"
              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          )}

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

        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
            className="text-sm text-primary font-medium hover:underline"
          >
            {isRegistering ? '¿Ya tienes cuenta? Iniciar Sesión' : '¿No tienes cuenta? Crear una'}
          </button>

          {!isRegistering && (
            <button
              onClick={async () => {
                const emailTrim = email.trim();
                if (!emailTrim.includes('@')) {
                  setError("Ingresa tu email para recuperar la contraseña");
                  return;
                }
                const { error } = await supabase.auth.resetPasswordForEmail(emailTrim, {
                  redirectTo: window.location.origin + '/reset-password',
                });
                if (error) setError(error.message);
                else setError("Se ha enviado un correo para restablecer tu contraseña.");
              }}
              className="text-xs text-gray-400 font-medium hover:text-primary transition-colors"
            >
              Olvidé mi contraseña
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 pb-8">
        Al ingresar, aceptas nuestra{' '}
        <button onClick={() => navigate('/privacy')} className="text-primary hover:underline">Política de Privacidad</button>.
      </p>
    </div>
  );
};

export default Login;
