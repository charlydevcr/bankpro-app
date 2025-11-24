// client/src/components/Sidebar.jsx
import React from 'react';
import { LayoutDashboard, Users, ArrowRightLeft, FileText, LogOut, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <--- 1. Importar Auth

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth(); // <--- 2. Sacar la función logout

  const handleLogout = () => {
      console.log("Cerrando sesión..."); // Debug para ver si funciona el clic
      logout();
  };
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Clientes & Cuentas', path: '/clientes' },
    { icon: ArrowRightLeft, label: 'Movimientos', path: '/movimientos' },
    { icon: FileText, label: 'Estados de Cuenta', path: '/reportes' },
    { icon: Settings, label: 'Configuración', path: '/config' },
  ];

  return (
    <div className="h-screen w-64 bg-sidebar text-white flex flex-col fixed left-0 top-0 shadow-xl z-10">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="bg-blue-600 p-1 rounded mr-3">
          <span className="font-bold text-lg text-white">B</span>
        </div>
        <span className="font-bold text-xl tracking-tight">BankPro</span>
      </div>

      {/* Menú */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-3 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-primary text-white shadow-lg shadow-blue-500/30' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} className="mr-3" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer del menú (LOGOUT) */}
      <div className="p-4 border-t border-slate-800">
        <button 
            onClick={handleLogout} // <--- 3. Evento Click
            type="button"
            className="flex items-center text-slate-400 hover:text-white text-sm transition-colors w-full cursor-pointer hover:bg-slate-800 p-2 rounded"
        >
          <LogOut size={18} className="mr-3" />
          Cerrar Sesión
        </button>
        <p className="text-xs text-slate-600 mt-4">v1.0.0 | Secure Bank App</p>
      </div>
    </div>
  );
};

export default Sidebar;