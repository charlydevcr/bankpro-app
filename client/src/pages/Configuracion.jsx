import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import { Settings, MapPin, Trash2, Plus, Upload, FileSpreadsheet, Shield, User, Lock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';

const Configuracion = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tipos'); 
  
  // --- SEGURIDAD: SI NO ES ADMIN, BLOQUEAR PANTALLA ---
  if (user?.rol !== 'ADMIN') {
      return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-10">
              <div className="bg-red-100 p-6 rounded-full mb-4">
                  <Shield size={64} className="text-red-500"/>
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Acceso Restringido</h1>
              <p className="text-slate-500 max-w-md">
                  Esta área contiene configuraciones sensibles del sistema. Solo los usuarios con perfil <strong>ADMINISTRADOR</strong> pueden acceder.
              </p>
          </div>
      );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
        <Settings className="mr-2" /> Configuración del Sistema
      </h1>

      {/* --- TABS DE NAVEGACIÓN --- */}
      <div className="flex space-x-4 border-b border-slate-200 mb-6 overflow-x-auto">
        <button 
            onClick={() => setActiveTab('tipos')} 
            className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'tipos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
            Tipos de Documento
        </button>
        <button 
            onClick={() => setActiveTab('zonas')} 
            className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'zonas' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
            Zonas Geográficas
        </button>
        <button 
            onClick={() => setActiveTab('conceptos')} 
            className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'conceptos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
            Conceptos Contables
        </button>
        {/* Pestaña de Usuarios (Nueva) */}
        <button 
            onClick={() => setActiveTab('usuarios')} 
            className={`pb-2 px-4 font-medium transition-colors flex items-center whitespace-nowrap ${activeTab === 'usuarios' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
            <Shield size={16} className="mr-2"/> Usuarios y Seguridad
        </button>
      </div>

      {/* --- ÁREA DE CONTENIDO --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {activeTab === 'tipos' && <CrudTipos />}
          {activeTab === 'zonas' && <CrudZonas />}
          {activeTab === 'conceptos' && <CrudConceptos />}
          {activeTab === 'usuarios' && <CrudUsuarios />}
      </div>
    </div>
  );
};

// ==================================================================
// 1. GESTIÓN DE USUARIOS
// ==================================================================
const CrudUsuarios = () => {
    const [lista, setLista] = useState([]);
    const { register, handleSubmit, reset } = useForm();

    const cargar = async () => {
        try {
            const res = await api.get('/usuarios');
            setLista(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => { cargar(); }, []);

    const crear = async (data) => {
        try { 
            await api.post('/usuarios', data); 
            alert("Usuario creado exitosamente");
            reset(); 
            cargar(); 
        } catch (e) { 
            alert(e.response?.data?.error || "Error al crear"); 
        }
    };

    const eliminar = async (id) => {
        if(!confirm("¿Seguro que deseas eliminar este usuario?")) return;
        try { await api.delete(`/usuarios/${id}`); cargar(); } catch (e) { alert("Error al eliminar"); }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-purple-50 p-4 rounded-lg h-fit border border-purple-100">
                <h3 className="font-bold mb-4 flex items-center text-purple-800"><User size={16} className="mr-2"/> Nuevo Usuario</h3>
                <form onSubmit={handleSubmit(crear)} className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-purple-700">Nombre Completo</label>
                        <input {...register('nombre')} className="w-full p-2 border rounded" required />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-purple-700">Correo Electrónico</label>
                        <input type="email" {...register('correo')} className="w-full p-2 border rounded" required />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-purple-700">Contraseña</label>
                        <div className="relative">
                            <input type="password" {...register('password')} className="w-full p-2 border rounded pl-8" required />
                            <Lock size={14} className="absolute left-2 top-3 text-slate-400"/>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-purple-700">Rol de Acceso</label>
                        <select {...register('rol')} className="w-full p-2 border rounded bg-white" required>
                            <option value="OPERADOR">OPERADOR (Limitado)</option>
                            <option value="ADMIN">ADMINISTRADOR (Total)</option>
                        </select>
                    </div>
                    <button className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 font-bold">Crear Usuario</button>
                </form>
            </div>

            <div className="md:col-span-2">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                            <tr>
                                <th className="px-4 py-3">Usuario</th>
                                <th className="px-4 py-3">Rol</th>
                                <th className="px-4 py-3">Creado</th>
                                <th className="px-4 py-3 text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {lista.map(u => (
                                <tr key={u.id_usuario} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <p className="font-bold text-slate-800">{u.nombre}</p>
                                        <p className="text-xs text-slate-500">{u.correo}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${u.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {u.rol}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">
                                        {new Date(u.creado_en).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => eliminar(u.id_usuario)} className="text-slate-400 hover:text-red-600 p-2">
                                            <Trash2 size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ==================================================================
// 2. TIPOS DE DOCUMENTO
// ==================================================================
const CrudTipos = () => {
    const [lista, setLista] = useState([]);
    const { register, handleSubmit, reset } = useForm();

    const cargar = async () => {
        const res = await api.get('/config/tipos');
        setLista(res.data);
    };
    useEffect(() => { cargar(); }, []);

    const crear = async (data) => {
        try { await api.post('/config/tipos', data); reset(); cargar(); } catch (e) { alert("Error"); }
    };
    const eliminar = async (id) => {
        if(!confirm("Eliminar?")) return;
        try { await api.delete(`/config/tipos/${id}`); cargar(); } catch (e) { alert(e.response?.data?.error); }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-4 rounded-lg h-fit">
                <h3 className="font-bold mb-4 flex items-center"><Plus size={16} className="mr-2"/> Agregar Tipo</h3>
                <form onSubmit={handleSubmit(crear)} className="space-y-3">
                    <input {...register('codigo')} placeholder="Código" className="w-full p-2 border rounded uppercase" required maxLength={5} />
                    <input {...register('descripcion')} placeholder="Descripción" className="w-full p-2 border rounded" required />
                    <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Guardar</button>
                </form>
            </div>
            <div className="md:col-span-2">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-xs uppercase">
                        <tr>
                            <th className="px-4 py-2">Código</th>
                            <th className="px-4 py-2">Descripción</th>
                            <th className="px-4 py-2">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lista.map(item => (
                            <tr key={item.id_tipo} className="border-b hover:bg-slate-50">
                                <td className="px-4 py-2 font-bold">{item.codigo}</td>
                                <td className="px-4 py-2">{item.descripcion}</td>
                                <td className="px-4 py-2">
                                    <button onClick={() => eliminar(item.id_tipo)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ==================================================================
// 3. ZONAS GEOGRÁFICAS
// ==================================================================
const CrudZonas = () => {
    const [lista, setLista] = useState([]);
    const { register, handleSubmit, reset } = useForm();
    const fileInputRef = useRef(null);

    const cargar = async () => { const res = await api.get('/config/zonas'); setLista(res.data); };
    useEffect(() => { cargar(); }, []);

    const crear = async (data) => { try { await api.post('/config/zonas', data); reset(); cargar(); } catch (e) { alert("Error"); } };
    const eliminar = async (id) => { if(!confirm("Eliminar?")) return; try { await api.delete(`/config/zonas/${id}`); cargar(); } catch (e) { alert(e.response?.data?.error); } };

    const handleImportClick = () => fileInputRef.current.click();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

                const zonasParaEnviar = [];
                for (let row of data) {
                    const colA = row[0];
                    const colB = row[1];
                    if (colA && colB) {
                        zonasParaEnviar.push({ provincia: colA.toString(), distrito: colB.toString() });
                    }
                }

                if (zonasParaEnviar.length === 0) {
                    alert("No se encontraron datos (Col A: Provincia, Col B: Distrito)");
                    return;
                }
                enviarMasivo(zonasParaEnviar);
            } catch (error) { alert("Error leyendo archivo"); }
            e.target.value = null;
        };
        reader.readAsBinaryString(file);
    };

    const enviarMasivo = async (items) => {
        if (!confirm(`Se importarán ${items.length} zonas. ¿Continuar?`)) return;
        try {
            const res = await api.post('/config/zonas/masivo', { items });
            alert(res.data.message);
            cargar();
        } catch (error) { alert("Error en el servidor"); }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-4 rounded-lg h-fit space-y-6">
                <div>
                    <h3 className="font-bold mb-4 flex items-center"><Plus size={16} className="mr-2"/> Agregar Zona</h3>
                    <form onSubmit={handleSubmit(crear)} className="space-y-3">
                        <input {...register('provincia')} placeholder="Provincia" className="w-full p-2 border rounded" required />
                        <input {...register('distrito')} placeholder="Distrito / Cantón" className="w-full p-2 border rounded" required />
                        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Guardar</button>
                    </form>
                </div>
                
                <hr className="border-slate-200"/>

                <div>
                    <h3 className="font-bold mb-2 flex items-center text-green-700"><FileSpreadsheet size={16} className="mr-2"/> Carga Masiva</h3>
                    <div className="bg-green-50 p-2 rounded border border-green-200 text-xs text-green-800 mb-3">
                        <p className="font-bold">Formato Excel:</p>
                        <ul className="list-disc ml-4 mt-1">
                            <li>Col A: Provincia</li>
                            <li>Col B: Distrito</li>
                        </ul>
                    </div>
                    <input type="file" accept=".xlsx, .xls" ref={fileInputRef} className="hidden" onChange={handleFileChange}/>
                    <button type="button" onClick={handleImportClick} className="w-full py-2 rounded bg-green-600 text-white font-bold hover:bg-green-700 flex justify-center items-center">
                        <Upload size={16} className="mr-2" /> Subir Excel
                    </button>
                </div>
            </div>

            <div className="md:col-span-2">
                <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-xs uppercase sticky top-0">
                            <tr>
                                <th className="px-4 py-2">Provincia</th>
                                <th className="px-4 py-2">Distrito</th>
                                <th className="px-4 py-2">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lista.map(item => (
                                <tr key={item.id_zona} className="border-b hover:bg-slate-50">
                                    <td className="px-4 py-2">{item.provincia}</td>
                                    <td className="px-4 py-2">{item.distrito}</td>
                                    <td className="px-4 py-2">
                                        <button onClick={() => eliminar(item.id_zona)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ==================================================================
// 4. CONCEPTOS CONTABLES
// ==================================================================
const CrudConceptos = () => {
    const [lista, setLista] = useState([]);
    const [zonas, setZonas] = useState([]);
    const { register, handleSubmit, reset, watch } = useForm();
    const fileInputRef = useRef(null);

    const zonaSeleccionada = watch('zonaId'); 

    const cargar = async () => {
        const [resConceptos, resZonas] = await Promise.all([
            api.get('/config/conceptos'),
            api.get('/config/zonas')
        ]);
        setLista(resConceptos.data);
        setZonas(resZonas.data);
    };

    useEffect(() => { cargar(); }, []);

    const crear = async (data) => { try { await api.post('/config/conceptos', data); reset(); cargar(); } catch (e) { alert("Error"); } };
    const eliminar = async (id) => { if(!confirm("Eliminar?")) return; try { await api.delete(`/config/conceptos/${id}`); cargar(); } catch (e) { alert(e.response?.data?.error); } };
    
    const handleImportClick = () => fileInputRef.current.click();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                const itemsParaEnviar = [];
                
                for (let row of data) {
                    const colA = row[0]; 
                    const colB = row[1]; 
                    const colC = row[2]; 

                    if (!colA) continue; 

                    if (zonaSeleccionada) {
                        itemsParaEnviar.push({ concepto: colA });
                    } else {
                        if (colB && colC) {
                            itemsParaEnviar.push({ concepto: colA, provincia: colB, distrito: colC });
                        }
                    }
                }
                if (itemsParaEnviar.length === 0) { alert("No se encontraron datos."); return; }
                enviarMasivo(itemsParaEnviar);
            } catch (error) { alert("Error leyendo el archivo."); }
            e.target.value = null;
        };
        reader.readAsBinaryString(file);
    };

    const enviarMasivo = async (items) => {
        const modo = zonaSeleccionada ? "a la zona seleccionada" : "creando zonas automáticamente";
        if (!confirm(`Se importarán ${items.length} conceptos ${modo}. ¿Continuar?`)) return;
        try {
            const res = await api.post('/config/conceptos/masivo', {
                items: items,
                zonaIdGlobal: zonaSeleccionada || null 
            });
            alert(res.data.message);
            cargar();
        } catch (error) {
            alert("Error en el servidor.");
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-4 rounded-lg h-fit space-y-6">
                <div>
                    <h3 className="font-bold mb-4 flex items-center"><Plus size={16} className="mr-2"/> Agregar Manual</h3>
                    <form onSubmit={handleSubmit(crear)} className="space-y-3">
                        <label className="block text-xs font-bold text-slate-500">Zona Asociada</label>
                        <select {...register('zonaId')} className="w-full p-2 border rounded bg-white" required>
                            <option value="">Seleccione Zona...</option>
                            {zonas.map(z => (<option key={z.id_zona} value={z.id_zona}>{z.provincia} - {z.distrito}</option>))}
                        </select>
                        <input {...register('descripcion')} placeholder="Descripción Concepto" className="w-full p-2 border rounded" required />
                        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Guardar</button>
                    </form>
                </div>

                <hr className="border-slate-200"/>

                <div>
                    <h3 className="font-bold mb-2 flex items-center text-green-700"><FileSpreadsheet size={16} className="mr-2"/> Carga Masiva</h3>
                    
                    {zonaSeleccionada ? (
                        <div className="bg-blue-50 p-2 rounded border border-blue-200 text-xs text-blue-800 mb-3">
                            <p className="font-bold">Modo: Zona Fija</p>
                            <p>Excel: <strong>Col A</strong> (Concepto).</p>
                        </div>
                    ) : (
                        <div className="bg-orange-50 p-2 rounded border border-orange-200 text-xs text-orange-800 mb-3">
                            <p className="font-bold">Modo: Multi-Zona</p>
                            <p>Excel: <strong>A</strong>:Concepto, <strong>B</strong>:Provincia, <strong>C</strong>:Distrito</p>
                        </div>
                    )}
                    
                    <input type="file" accept=".xlsx, .xls" ref={fileInputRef} className="hidden" onChange={handleFileChange}/>
                    <button type="button" onClick={handleImportClick} className="w-full py-2 rounded bg-green-600 text-white font-bold hover:bg-green-700 flex justify-center items-center">
                        <Upload size={16} className="mr-2" /> Subir Excel
                    </button>
                    
                    {zonaSeleccionada && (
                        <button type="button" onClick={() => reset({ zonaId: "" })} className="text-xs text-slate-500 hover:text-blue-600 mt-2 underline w-full text-center">
                            Quitar selección
                        </button>
                    )}
                </div>
            </div>

            <div className="md:col-span-2">
                <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-xs uppercase sticky top-0">
                            <tr>
                                <th className="px-4 py-2">Concepto</th>
                                <th className="px-4 py-2">Zona</th>
                                <th className="px-4 py-2">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lista.map(item => (
                                <tr key={item.id_concepto} className="border-b hover:bg-slate-50">
                                    <td className="px-4 py-2 font-medium">{item.descripcion}</td>
                                    <td className="px-4 py-2 text-slate-500 text-xs">
                                        <MapPin size={12} className="inline mr-1"/>
                                        {item.zona ? `${item.zona.provincia}, ${item.zona.distrito}` : 'Sin zona'}
                                    </td>
                                    <td className="px-4 py-2">
                                        <button onClick={() => eliminar(item.id_concepto)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Configuracion;