import React, { useState, useEffect } from 'react';
import { Plus, Search, User, X, Wallet, ArrowRightLeft, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext'; // Importante para seguridad

const Clientes = () => {
  // --- CONTEXTO DE SEGURIDAD ---
  const { user } = useAuth();

  // --- ESTADOS ---
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Modales
  const [showModalCliente, setShowModalCliente] = useState(false);
  const [showModalCuenta, setShowModalCuenta] = useState(false);
  
  // Estado de Selección
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  
  // Hooks
  const navigate = useNavigate();

  // Formularios Independientes
  const { 
    register: registerCliente, 
    handleSubmit: handleSubmitCliente, 
    reset: resetCliente 
  } = useForm();

  const { 
    register: registerCuenta, 
    handleSubmit: handleSubmitCuenta, 
    reset: resetCuenta 
  } = useForm();


  // --- LÓGICA DE CARGA ---
  const fetchClientes = async () => {
    try {
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error("Error cargando clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);


  // --- LÓGICA DE CREACIÓN ---
  const onSubmitCliente = async (data) => {
    try {
      await api.post('/clientes', data);
      setShowModalCliente(false);
      resetCliente();
      fetchClientes();
      alert("✅ Cliente creado correctamente");
    } catch (error) {
      alert(error.response?.data?.error || "Error al crear cliente");
    }
  };

  const abrirModalCuenta = (cliente) => {
    setClienteSeleccionado(cliente);
    setShowModalCuenta(true);
    resetCuenta();
  };

  const onSubmitCuenta = async (data) => {
    if (!clienteSeleccionado) return;

    const payload = {
        clienteId: clienteSeleccionado.id_cliente,
        iban: data.iban,
        num_cuenta_bancaria: data.num_cuenta,
        tipo_cuenta: data.tipo,
        moneda: data.moneda,
        saldo_inicial: parseFloat(data.saldo_inicial || 0)
    };

    try {
        await api.post('/cuentas', payload);
        setShowModalCuenta(false);
        fetchClientes();
        alert(`✅ Cuenta agregada a ${clienteSeleccionado.nombre}`);
    } catch (error) {
        alert(error.response?.data?.error || "Error al crear cuenta");
    }
  };


  // --- LÓGICA DE NAVEGACIÓN ---
  const irAMovimientos = (idCliente, iban) => {
      navigate(`/movimientos?clienteId=${idCliente}&iban=${iban}`);
  };


  // --- LÓGICA DE ELIMINACIÓN (SEGURA) ---
  const eliminarCliente = async (id, nombre) => {
      // Doble confirmación por seguridad
      if (!confirm(`⚠️ PELIGRO DE DATOS\n\n¿Estás seguro de eliminar al cliente "${nombre}"?\n\nEsta acción borrará permanentemente:\n- El perfil del cliente\n- Todas sus cuentas bancarias\n- Todos sus movimientos históricos`)) return;
      
      try {
          await api.delete(`/clientes/${id}`);
          alert("Cliente eliminado correctamente.");
          fetchClientes();
      } catch (error) {
          alert("Error eliminando cliente: " + (error.response?.data?.error || "Desconocido"));
      }
  };

  const eliminarCuenta = async (iban) => {
      if (!confirm(`¿Seguro que deseas eliminar la cuenta ${iban}?\nSe perderán todos los movimientos asociados.`)) return;

      try {
          await api.delete(`/cuentas/${iban}`);
          alert("Cuenta eliminada.");
          fetchClientes();
      } catch (error) {
          alert("Error eliminando cuenta: " + (error.response?.data?.error || "Desconocido"));
      }
  };


  // --- RENDER ---
  return (
    <div className="p-8 max-w-7xl mx-auto">
      
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Clientes</h1>
          <p className="text-slate-500">Administración de perfiles y productos bancarios</p>
        </div>
        <button 
            onClick={() => setShowModalCliente(true)} 
            className="bg-sidebar text-white px-4 py-2 rounded-lg flex items-center hover:bg-slate-800 transition-colors shadow-lg"
        >
          <Plus size={20} className="mr-2" /> Nuevo Cliente
        </button>
      </div>

      {/* Lista de Clientes */}
      {loading ? (
        <div className="text-center py-10 text-slate-500">Cargando información...</div>
      ) : (
        <div className="space-y-4">
          {clientes.map((cliente) => (
            <div key={cliente.id_cliente} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition-all relative group">
              
              {/* --- SEGURIDAD: SOLO ADMIN VE EL BASURERO --- */}
              {user.rol === 'ADMIN' && (
                  <button 
                    onClick={() => eliminarCliente(cliente.id_cliente, cliente.nombre)}
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 p-2 transition-colors"
                    title="Eliminar Cliente (Solo Admin)"
                  >
                    <Trash2 size={20} />
                  </button>
              )}

              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4 w-full">
                  {/* Avatar */}
                  <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                    <User size={24} />
                  </div>
                  
                  {/* Info Principal */}
                  <div className="w-full pr-10">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg text-slate-800">{cliente.nombre}</h3>
                    </div>
                    
                    <div className="flex items-center text-slate-500 text-sm mt-1 space-x-4">
                        <span>ID: {cliente.cedula}</span>
                        <span>{cliente.correo}</span>
                        <button 
                            onClick={() => abrirModalCuenta(cliente)}
                            className="text-blue-600 hover:underline text-xs font-bold flex items-center ml-4"
                        >
                            <Plus size={12} className="mr-1"/> Agregar Cuenta
                        </button>
                    </div>

                    {/* Tarjetas de Cuentas */}
                    <div className="mt-4 flex flex-wrap gap-3">
                        {cliente.cuentas && cliente.cuentas.length > 0 ? cliente.cuentas.map(cta => (
                             <div key={cta.iban} className="bg-slate-50 border border-slate-200 rounded pl-3 pr-2 py-2 flex items-center space-x-3 group/cta hover:bg-slate-100 transition-colors">
                                {/* Icono Moneda */}
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${cta.moneda === 'USD' ? 'bg-green-500' : 'bg-blue-500'}`}>
                                    {cta.moneda}
                                </div>
                                
                                {/* Info Cuenta */}
                                <div>
                                    <p className="text-xs text-slate-500 font-bold">{cta.tipo_cuenta}</p>
                                    <p className="text-sm font-mono text-slate-700">{cta.iban}</p>
                                </div>
                                
                                {/* Saldo */}
                                <div className="pl-2 border-l border-slate-200">
                                    <p className="text-xs text-slate-400">Saldo</p>
                                    <p className="text-sm font-bold text-slate-700">{cta.saldo_actual}</p>
                                </div>
                                
                                {/* Acciones de Cuenta */}
                                <div className="flex items-center space-x-1 pl-2">
                                    {/* Ir a Movimientos (Disponible para todos) */}
                                    <button 
                                        onClick={() => irAMovimientos(cliente.id_cliente, cta.iban)}
                                        title="Registrar Movimiento"
                                        className="p-1.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-all"
                                    >
                                        <ArrowRightLeft size={14} />
                                    </button>
                                    
                                    {/* Eliminar Cuenta (SOLO ADMIN) */}
                                    {user.rol === 'ADMIN' && (
                                        <button 
                                            onClick={() => eliminarCuenta(cta.iban)}
                                            title="Eliminar Cuenta (Solo Admin)"
                                            className="p-1.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-red-600 hover:border-red-600 hover:bg-red-50 transition-all"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                             </div>
                        )) : (
                            <span className="text-sm text-slate-400 italic py-2">Sin cuentas asociadas.</span>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL CREAR CLIENTE --- */}
      {showModalCliente && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between mb-4">
                <h2 className="font-bold text-lg">Nuevo Cliente</h2>
                <button onClick={() => setShowModalCliente(false)}><X /></button>
            </div>
            <form onSubmit={handleSubmitCliente(onSubmitCliente)} className="space-y-4">
                <input {...registerCliente("nombre")} placeholder="Nombre Completo" className="w-full p-2 border rounded" required />
                <input {...registerCliente("cedula")} placeholder="Cédula" className="w-full p-2 border rounded" required />
                <input {...registerCliente("correo")} placeholder="Correo" className="w-full p-2 border rounded" required />
                <input {...registerCliente("telefono")} placeholder="Teléfono" className="w-full p-2 border rounded" />
                <button className="w-full bg-sidebar text-white py-2 rounded hover:bg-slate-800">Guardar Cliente</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL AGREGAR CUENTA --- */}
      {showModalCuenta && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in duration-200">
            <div className="flex justify-between mb-4 border-b pb-2">
                <div>
                    <h2 className="font-bold text-lg text-slate-800">Agregar Cuenta Bancaria</h2>
                    <p className="text-sm text-slate-500">Cliente: <span className="font-bold text-blue-600">{clienteSeleccionado?.nombre}</span></p>
                </div>
                <button onClick={() => setShowModalCuenta(false)}><X /></button>
            </div>

            <form onSubmit={handleSubmitCuenta(onSubmitCuenta)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500">Tipo de Cuenta</label>
                        <select {...registerCuenta("tipo")} className="w-full p-2 border rounded bg-white" required>
                            <option value="Ahorros">Ahorros</option>
                            <option value="Corriente">Corriente</option>
                            <option value="Inversión">Inversión</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500">Moneda</label>
                        <select {...registerCuenta("moneda")} className="w-full p-2 border rounded bg-white" required>
                            <option value="CRC">Colones (CRC)</option>
                            <option value="USD">Dólares (USD)</option>
                            <option value="EUR">Euros (EUR)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500">IBAN</label>
                    <input {...registerCuenta("iban")} placeholder="CR000..." className="w-full p-2 border rounded" required />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500">Número de Cuenta Interno</label>
                    <input {...registerCuenta("num_cuenta")} placeholder="100-00..." className="w-full p-2 border rounded" required />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500">Saldo Inicial</label>
                    <input type="number" step="0.01" {...registerCuenta("saldo_inicial")} placeholder="0.00" className="w-full p-2 border rounded" />
                </div>

                <div className="pt-4">
                    <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium">
                        Crear Cuenta
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Clientes;