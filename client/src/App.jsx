import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Componentes
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Recuperar from './pages/Recuperar'; // <--- NUEVO
import Restablecer from './pages/Restablecer'; // <--- NUEVO
import Clientes from './pages/Clientes';
import Movimientos from './pages/Movimientos';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';

const Dashboard = () => <div className="p-8"><h1 className="text-2xl font-bold text-slate-800">Dashboard General</h1></div>;

const ProtectedLayout = ({ children }) => {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <div className="flex-1 ml-64 transition-all duration-300">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-50">
            <span className="text-slate-500 text-sm font-bold">BankStatement Pro</span>
            <div className="flex items-center space-x-4">
               <span className="text-sm text-slate-600 mr-2">Hola, <strong>{user.nombre}</strong></span>
               <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-200">{user.nombre.charAt(0)}</div>
               <button onClick={logout} className="text-xs text-red-500 hover:underline ml-2">Salir</button>
            </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/" /> : children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/recuperar" element={<PublicRoute><Recuperar /></PublicRoute>} />
          <Route path="/reset-password/:token" element={<PublicRoute><Restablecer /></PublicRoute>} />

          {/* Rutas Privadas */}
          <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/clientes" element={<ProtectedLayout><Clientes /></ProtectedLayout>} />
          <Route path="/movimientos" element={<ProtectedLayout><Movimientos /></ProtectedLayout>} />
          <Route path="/reportes" element={<ProtectedLayout><Reportes /></ProtectedLayout>} />
          <Route path="/config" element={<ProtectedLayout><Configuracion /></ProtectedLayout>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;