import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Mail, ArrowLeft, Send } from 'lucide-react';

const Recuperar = () => {
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { correo });
      setMensaje(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Recuperar Acceso</h1>
          <p className="text-slate-500 text-sm mt-2">Ingresa tu correo para buscar tu cuenta.</p>
        </div>

        {mensaje ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 text-center">
            <p className="font-bold mb-2">¡Enlace Enviado!</p>
            <p className="text-sm">{mensaje}</p>
            <Link to="/login" className="block mt-4 text-blue-600 hover:underline font-bold">Volver a Iniciar Sesión</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="ejemplo@banco.com"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center disabled:bg-slate-400"
            >
              {loading ? 'Enviando...' : <><Send size={18} className="mr-2" /> Enviar Enlace</>}
            </button>

            <div className="text-center">
                <Link to="/login" className="text-slate-500 hover:text-slate-800 text-sm flex items-center justify-center">
                    <ArrowLeft size={14} className="mr-1"/> Volver al Login
                </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Recuperar;