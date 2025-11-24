import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Lock, CheckCircle } from 'lucide-react';

const Restablecer = () => {
  const { token } = useParams(); // Obtener token de la URL
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
        return setError("Las contraseñas no coinciden");
    }
    if (password.length < 6) {
        return setError("La contraseña debe tener al menos 6 caracteres");
    }

    setLoading(true);
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { newPassword: password });
      setMensaje(res.data.message);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
          navigate('/login');
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.error || 'Token inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Nueva Contraseña</h1>
          <p className="text-slate-500 text-sm mt-2">Define tu nueva clave de acceso.</p>
        </div>

        {mensaje ? (
          <div className="bg-green-50 text-green-700 p-6 rounded-lg border border-green-200 text-center">
            <CheckCircle size={48} className="mx-auto mb-3 text-green-600"/>
            <p className="font-bold text-lg">¡Contraseña Actualizada!</p>
            <p className="text-sm mt-2">Redirigiendo al login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center disabled:bg-slate-400"
            >
              {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Restablecer;