import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext'; // Importante para seguridad
import { ArrowRightLeft, AlertTriangle, TrendingUp, TrendingDown, Calendar, FileText, Trash2, Clock, Loader2, MapPin, Plus, X, Save, Pencil } from 'lucide-react';

const Movimientos = () => {
  // --- CONTEXTO DE SEGURIDAD ---
  const { user } = useAuth();

  // --- ESTADOS ---
  const [clientes, setClientes] = useState([]);
  const [cuentasCliente, setCuentasCliente] = useState([]); 
  const [config, setConfig] = useState({ tipos: [], conceptos: [], zonas: [] }); 
  const [conceptosFiltrados, setConceptosFiltrados] = useState([]); 
  
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null); 
  const [loadingData, setLoadingData] = useState(true);
  const [movimientosRecientes, setMovimientosRecientes] = useState([]);
  const [cargandoTabla, setCargandoTabla] = useState(false);
  
  // Estados de UI
  const [showModalRapido, setShowModalRapido] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [searchParams] = useSearchParams();
  const today = new Date().toISOString().split('T')[0];

  const { register, handleSubmit, watch, reset, setValue, getValues, setError, clearErrors, formState: { errors } } = useForm({
      defaultValues: { 
          tipo_operacion: 'D',
          fecha_movimiento: today,
          fecha_contable: today,
          cliente_select: '',
          iban_select: '',
          zona_select: ''
      } 
  });

  // --- WATCHERS ---
  const montoInput = watch("monto");
  const tipoOperacionInput = watch("tipo_operacion");
  const fechaMovimiento = watch("fecha_movimiento"); 
  const tipoDocumentoSeleccionado = watch("tipo_documento_id");
  const selectedClienteId = watch('cliente_select');
  const selectedIban = watch('iban_select');
  const selectedZona = watch('zona_select');

  // --- UTILIDAD FECHAS ---
  const formatearFechaTabla = (fechaString) => {
      if (!fechaString) return "";
      const parteFecha = fechaString.split('T')[0];
      const [year, month, day] = parteFecha.split('-');
      return `${day}/${month}/${year}`;
  };

  // --- 1. CARGA INICIAL ---
  useEffect(() => {
    const iniciarPagina = async () => {
        try {
            setLoadingData(true);
            const [resClientes, resConfig] = await Promise.all([
                api.get('/clientes'),
                api.get('/movimientos/config')
            ]);
            setClientes(resClientes.data);
            setConfig(resConfig.data);

            const paramClienteId = searchParams.get('clienteId');
            const paramIban = searchParams.get('iban');

            if (paramClienteId && paramIban) {
                setValue('cliente_select', parseInt(paramClienteId));
                setTimeout(() => setValue('iban_select', paramIban), 100);
            }
        } catch (error) {
            console.error("Error cargando datos:", error);
        } finally {
            setLoadingData(false);
        }
    };
    iniciarPagina();
  }, [searchParams, setValue]);


  // --- 2. EFECTO: CAMBIO DE ZONA ---
  useEffect(() => {
      const cargarConceptos = async () => {
          if (selectedZona) {
              try {
                  const res = await api.get(`/movimientos/conceptos/${selectedZona}`);
                  setConceptosFiltrados(res.data);
              } catch (error) {
                  console.error("Error cargando conceptos");
              }
          } else {
              setConceptosFiltrados([]);
              // Si no hay zona seleccionada y no estamos editando, limpiamos el concepto
              if (!selectedZona && !editingId) setValue('concepto_id', '');
          }
      };
      cargarConceptos();
  }, [selectedZona, setValue, editingId]);


  // --- 3. LÓGICA CLIENTE / CUENTA ---
  useEffect(() => {
      if (!selectedClienteId) {
          setCuentasCliente([]);
          return;
      }
      const cliente = clientes.find(c => c.id_cliente === parseInt(selectedClienteId));
      if (cliente) {
          setCuentasCliente(cliente.cuentas);
          const cuentaAunValida = cliente.cuentas.find(c => c.iban === selectedIban);
          if (!cuentaAunValida) {
              setValue('iban_select', '');
              setCuentaSeleccionada(null);
              setMovimientosRecientes([]);
          }
      }
  }, [selectedClienteId, clientes, setValue]);

  useEffect(() => {
      if (!selectedIban || !selectedClienteId) {
          setCuentaSeleccionada(null);
          setMovimientosRecientes([]);
          return;
      }
      const clienteActual = clientes.find(c => c.id_cliente === parseInt(selectedClienteId));
      if (!clienteActual) return;

      const cuentaReal = clienteActual.cuentas.find(c => c.iban === selectedIban);
      if (!cuentaReal) {
          setCuentaSeleccionada(null);
          setMovimientosRecientes([]);
          return;
      }

      setCuentaSeleccionada(cuentaReal);
      setCargandoTabla(true);
      api.get(`/movimientos/${selectedIban}`)
         .then(res => setMovimientosRecientes(res.data))
         .catch(err => console.error(err))
         .finally(() => setCargandoTabla(false));

  }, [selectedIban, selectedClienteId, clientes]);


  // --- 4. CONSECUTIVO ---
  useEffect(() => {
      // No sobreescribir consecutivo si estamos editando un movimiento existente
      if (editingId) return;

      const obtenerConsecutivo = async () => {
          if (tipoDocumentoSeleccionado && tipoDocumentoSeleccionado !== "") {
              try {
                  const res = await api.get(`/movimientos/siguiente-numero/${tipoDocumentoSeleccionado}`);
                  setValue("num_documento", res.data.siguiente);
                  clearErrors("num_documento"); 
              } catch (error) { console.error(error); }
          } else {
              setValue("num_documento", "");
          }
      };
      obtenerConsecutivo();
  }, [tipoDocumentoSeleccionado, setValue, clearErrors, editingId]);


  // --- FUNCIONES DE EDICIÓN ---
  const cargarParaEditar = (mov) => {
      setEditingId(mov.id_movimiento);
      clearErrors();
      
      // Cargar datos planos
      setValue("tipo_operacion", mov.tipo_operacion);
      setValue("monto", mov.monto);
      setValue("fecha_movimiento", mov.fecha_movimiento.split('T')[0]);
      setValue("fecha_contable", mov.fecha_contable.split('T')[0]);
      setValue("tipo_documento_id", mov.tipoDocumentoId);
      setValue("num_documento", mov.num_documento);
      setValue("referencia", mov.tarjeta || "");

      // Cargar Zona y Concepto
      if (mov.concepto && mov.concepto.zonaId) {
          setValue("zona_select", mov.concepto.zonaId.toString());
          
          // Forzamos la carga manual para asegurar que el concepto esté disponible
          api.get(`/movimientos/conceptos/${mov.concepto.zonaId}`)
             .then(res => {
                 setConceptosFiltrados(res.data);
                 setTimeout(() => setValue("concepto_id", mov.conceptoId), 50);
             });
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
      setEditingId(null);
      const currCli = getValues('cliente_select');
      const currIban = getValues('iban_select');
      reset({
          cliente_select: currCli,
          iban_select: currIban,
          fecha_movimiento: today, 
          fecha_contable: today, 
          tipo_operacion: 'D',
          zona_select: ''
      });
      setConceptosFiltrados([]);
  };


  // --- ELIMINAR MOVIMIENTO (PROTEGIDO) ---
  const eliminarMovimiento = async (id) => {
      if (editingId) { alert("Termina de editar primero."); return; }
      
      if(!window.confirm("¿Estás seguro de eliminar este movimiento?\nSe reversará el saldo de la cuenta.")) return;
      
      try {
          await api.delete(`/movimientos/${id}`);
          
          // Recargar datos
          const resClientes = await api.get('/clientes');
          setClientes(resClientes.data);
          
          if (selectedIban) {
              const resMovs = await api.get(`/movimientos/${selectedIban}`);
              setMovimientosRecientes(resMovs.data);
              
              const cl = resClientes.data.find(c => c.id_cliente === parseInt(selectedClienteId));
              const ct = cl?.cuentas.find(c => c.iban === selectedIban);
              if(ct) setCuentaSeleccionada(ct);
          }
          alert("🗑️ Eliminado.");
      } catch (error) {
          alert("Error: " + (error.response?.data?.error || error.message));
      }
  };


  // --- SUBMIT (CREAR O EDITAR) ---
  const onSubmit = async (data) => {
      try {
          clearErrors();
          
          if (editingId) {
              await api.put(`/movimientos/${editingId}`, { ...data, iban: cuentaSeleccionada.iban });
              alert("✅ Movimiento actualizado correctamente");
              setEditingId(null);
          } else {
              await api.post('/movimientos', { ...data, iban: cuentaSeleccionada.iban });
              alert(`✅ Movimiento registrado`);
          }
          
          const currentIban = getValues('iban_select');
          const currentClienteId = getValues('cliente_select');
          const currentZona = getValues('zona_select'); 

          reset({ 
              cliente_select: currentClienteId,
              iban_select: currentIban,
              fecha_movimiento: today, 
              fecha_contable: today, 
              tipo_operacion: 'D',
              monto: '',
              num_documento: '', 
              referencia: '',
              tipo_documento_id: '',
              zona_select: currentZona, 
              concepto_id: '' 
          });

          const res = await api.get('/clientes');
          setClientes(res.data); 
          const cl = res.data.find(c => c.id_cliente === parseInt(currentClienteId));
          const ct = cl?.cuentas.find(c => c.iban === currentIban);
          if (ct) {
              setCuentaSeleccionada(ct);
              const resMovs = await api.get(`/movimientos/${currentIban}`);
              setMovimientosRecientes(resMovs.data);
          }

      } catch (error) {
          const msg = error.response?.data?.error || "Error al procesar";
          if (msg.toLowerCase().includes("existe") || msg.toLowerCase().includes("documento")) {
              setError("num_documento", { type: "manual", message: msg });
          } else {
              alert(msg);
          }
      }
  };

  // --- CALLBACK CREACIÓN RÁPIDA ---
  const handleConceptoCreado = async (idZona, idConcepto) => {
      try {
          const resConfig = await api.get('/movimientos/config');
          setConfig(resConfig.data);
          
          const resConceptos = await api.get(`/movimientos/conceptos/${idZona}`);
          setConceptosFiltrados(resConceptos.data);
          
          setTimeout(() => {
              setValue('zona_select', idZona.toString());
              setValue('concepto_id', idConcepto.toString());
          }, 100);

          setShowModalRapido(false);
      } catch (error) {
          console.error("Error actualizando tras creación rápida", error);
      }
  };

  const saldoProyectado = () => {
    if (!cuentaSeleccionada) return 0;
    const saldoActual = parseFloat(cuentaSeleccionada.saldo_actual);
    const monto = parseFloat(montoInput || 0);
    
    if (editingId) return saldoActual; // No proyectar en edición
    
    if (tipoOperacionInput === 'C') return saldoActual + monto;
    return saldoActual - monto;
  };
  const esSaldoNegativo = saldoProyectado() < 0;


  if (loadingData) return <div className="p-8 text-center text-slate-500">Cargando datos...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center justify-between">
        <div className="flex items-center">
            <ArrowRightLeft className="mr-2" /> Gestión de Movimientos
        </div>
        {editingId && (
            <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full border border-yellow-300 animate-pulse">
                ✏️ Editando Movimiento #{getValues('num_documento')}
            </span>
        )}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
            <div className={`p-6 rounded-xl shadow-sm border transition-colors ${editingId ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-slate-200'}`}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    
                    {/* CLIENTE Y CUENTA */}
                    <div className="grid grid-cols-2 gap-4 bg-white/50 p-4 rounded-lg border border-slate-200/50">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Cliente</label>
                            <select {...register('cliente_select')} disabled={!!editingId} className="w-full p-2 border rounded bg-white text-sm disabled:bg-slate-100 disabled:text-slate-400">
                                <option value="">Seleccione...</option>
                                {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Cuenta</label>
                            <select {...register('iban_select')} disabled={!!editingId} className="w-full p-2 border rounded bg-white text-sm disabled:bg-slate-100 disabled:text-slate-400">
                                {!selectedClienteId ? <option value="">← Seleccione cliente</option> : cuentasCliente.length === 0 ? <option value="">Sin cuentas</option> : <>{<option value="">Seleccione...</option>}{cuentasCliente.map(cta => (<option key={cta.iban} value={cta.iban}>{cta.tipo_cuenta} - {cta.moneda}</option>))}</>}
                            </select>
                        </div>
                    </div>

                    {/* FECHAS */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Movimiento</label>
                            <input type="date" {...register("fecha_movimiento", { required: true })} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Contable</label>
                            <input type="date" {...register("fecha_contable", { required: true })} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"/>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 my-2"></div>

                    {/* OPERACIÓN Y MONTO */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo Operación</label>
                            <div className="flex space-x-2">
                                <label className={`flex-1 cursor-pointer text-center py-2 rounded border transition-colors ${tipoOperacionInput === 'C' ? 'bg-green-100 border-green-500 text-green-700 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}><input type="radio" {...register("tipo_operacion")} value="C" className="hidden" /> Crédito (+)</label>
                                <label className={`flex-1 cursor-pointer text-center py-2 rounded border transition-colors ${tipoOperacionInput === 'D' ? 'bg-red-100 border-red-500 text-red-700 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}><input type="radio" {...register("tipo_operacion")} value="D" className="hidden" /> Débito (-)</label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
                            <input type="number" step="0.01" {...register("monto", { required: true, min: 0.01 })} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono text-xl font-bold text-slate-700" placeholder="0.00"/>
                        </div>
                    </div>

                    {/* DOCUMENTO */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo Documento</label>
                            <select {...register("tipo_documento_id")} className="w-full p-2 border rounded bg-white">
                                <option value="">Seleccionar...</option>
                                {config.tipos.map(t => <option key={t.id_tipo} value={t.id_tipo}>{t.codigo} - {t.descripcion}</option>)}
                            </select>
                        </div>
                        <div className="col-span-1 relative">
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center"><FileText size={14} className="mr-1"/> N° Doc</label>
                            <input type="number" {...register("num_documento", { required: true })} onChange={(e) => { register("num_documento").onChange(e); clearErrors("num_documento"); }} className={`w-full p-2 border rounded outline-none font-bold text-slate-800 ${errors.num_documento ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-300'}`} placeholder="#"/>
                            {errors.num_documento && <span className="absolute -bottom-8 left-0 text-[10px] leading-tight text-red-600 font-bold bg-red-50 p-1 rounded border border-red-200 shadow-sm z-10">{errors.num_documento.message}</span>}
                        </div>
                    </div>

                    {/* ZONA Y CONCEPTO */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center"><MapPin size={16} className="mr-1 text-slate-400"/> Zona</label>
                            <select {...register("zona_select")} className="w-full p-2 border rounded bg-white h-10">
                                <option value="">Filtrar por zona...</option>
                                {config.zonas.map(z => (<option key={z.id_zona} value={z.id_zona}>{z.provincia} - {z.distrito}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Concepto</label>
                            <div className="flex space-x-2">
                                <select 
                                    {...register("concepto_id")} 
                                    className="w-full p-2 border rounded bg-white disabled:bg-slate-100 h-10 flex-1" 
                                    disabled={!selectedZona && conceptosFiltrados.length === 0}
                                >
                                    <option value="">{!selectedZona ? "← Elija zona" : "Seleccionar..."}</option>
                                    {conceptosFiltrados.map(c => (<option key={c.id_concepto} value={c.id_concepto}>{c.descripcion}</option>))}
                                </select>
                                <button type="button" onClick={() => setShowModalRapido(true)} className="h-10 w-12 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center" title="Crear nuevo"><Plus size={20} /></button>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Referencia / Tarjeta</label>
                        <input {...register("referencia")} className="w-full p-2 border rounded" placeholder="Opcional" />
                    </div>

                    {/* BOTONES ACCIÓN */}
                    <div className="flex space-x-3 pt-2">
                        {editingId && <button type="button" onClick={cancelarEdicion} className="w-1/3 bg-slate-200 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-300 transition-colors">Cancelar</button>}
                        <button type="submit" disabled={!cuentaSeleccionada || (!editingId && esSaldoNegativo)} className={`flex-1 py-3 rounded-lg font-bold text-white shadow-lg transition-all ${(!editingId && esSaldoNegativo) || !cuentaSeleccionada ? 'bg-slate-400 cursor-not-allowed' : editingId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-sidebar hover:bg-slate-800'}`}>{editingId ? 'ACTUALIZAR MOVIMIENTO' : 'PROCESAR MOVIMIENTO'}</button>
                    </div>
                </form>
            </div>

            {/* TABLA HISTORIAL */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 flex items-center"><Clock className="mr-2 text-slate-400" size={18}/> Historial Reciente</h3>
                </div>
                <div className="max-h-96 overflow-y-auto relative">
                    {cargandoTabla && <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>}
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0"><tr><th className="px-6 py-3">Fecha</th><th className="px-6 py-3">Doc</th><th className="px-6 py-3">Tipo</th><th className="px-6 py-3 text-right">Monto</th><th className="px-6 py-3 text-center">Acción</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {movimientosRecientes.map((mov) => (
                                <tr key={mov.id_movimiento} className={`hover:bg-slate-50 ${editingId === mov.id_movimiento ? 'bg-yellow-50' : ''}`}>
                                    <td className="px-6 py-3 text-slate-600">{formatearFechaTabla(mov.fecha_movimiento)}</td>
                                    <td className="px-6 py-3 font-mono text-xs">{mov.tipoDocumento.codigo}-{mov.num_documento}</td>
                                    <td className="px-6 py-3"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${mov.tipo_operacion === 'C' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{mov.tipo_operacion === 'C' ? 'CRÉDITO' : 'DÉBITO'}</span></td>
                                    <td className={`px-6 py-3 text-right font-bold ${mov.tipo_operacion === 'C' ? 'text-green-600' : 'text-red-600'}`}>{parseFloat(mov.monto).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-3 text-center flex justify-center space-x-1">
                                        <button onClick={() => cargarParaEditar(mov)} className="text-blue-400 hover:text-blue-600 p-2 rounded hover:bg-blue-50" title="Editar"><Pencil size={16}/></button>
                                        
                                        {/* SEGURIDAD: SOLO ADMIN PUEDE ELIMINAR */}
                                        {user?.rol === 'ADMIN' && (
                                            <button onClick={() => eliminarMovimiento(mov.id_movimiento)} className="text-slate-400 hover:text-red-600 p-2 rounded hover:bg-red-50" title="Eliminar"><Trash2 size={16}/></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* SIMULADOR */}
        <div className="h-fit sticky top-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-4">Simulación de Saldo</h3>
                {cuentaSeleccionada ? (
                    <div className="space-y-6">
                        <div><p className="text-xs text-slate-400">Saldo Actual</p><p className="text-2xl font-mono text-slate-700 font-bold">{parseFloat(cuentaSeleccionada.saldo_actual).toLocaleString('en-US', { style: 'currency', currency: cuentaSeleccionada.moneda })}</p></div>
                        {!editingId ? (
                            <>
                                <div className={`flex items-center p-3 rounded-lg ${tipoOperacionInput === 'C' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{tipoOperacionInput === 'C' ? <TrendingUp className="mr-2"/> : <TrendingDown className="mr-2"/>}<span className="font-bold text-lg">{tipoOperacionInput === 'C' ? '+ ' : '- '}{parseFloat(montoInput || 0).toLocaleString('en-US', { style: 'currency', currency: cuentaSeleccionada.moneda })}</span></div>
                                <div className="border-t border-slate-300 my-2"></div>
                                <div><p className="text-xs text-slate-400">Nuevo Saldo Proyectado</p><p className={`text-3xl font-mono font-bold ${esSaldoNegativo ? 'text-red-600' : 'text-blue-600'}`}>{saldoProyectado().toLocaleString('en-US', { style: 'currency', currency: cuentaSeleccionada.moneda })}</p></div>
                                {esSaldoNegativo && <div className="bg-red-50 border border-red-200 p-3 rounded text-red-700 text-sm flex items-start"><AlertTriangle className="mr-2 shrink-0" size={18} /><span><strong>¡Atención!</strong> Saldo insuficiente.</span></div>}
                            </>
                        ) : <div className="p-4 bg-yellow-100 border border-yellow-200 rounded text-yellow-800 text-sm"><p><strong>Modo Edición Activo</strong></p><p className="mt-1">Simulación desactivada.</p></div>}
                    </div>
                ) : <div className="text-center text-slate-400 py-10"><ArrowRightLeft size={48} className="mx-auto mb-2 opacity-20" /><p>Seleccione una cuenta</p></div>}
            </div>
        </div>
      </div>

      {showModalRapido && (
          <ModalCrearRapido 
              zonas={config.zonas} 
              zonaPreseleccionada={selectedZona} 
              onClose={() => setShowModalRapido(false)} 
              onSuccess={handleConceptoCreado}
          />
      )}
    </div>
  );
};

// --- MODAL INTERNO DE CREACIÓN RÁPIDA ---
const ModalCrearRapido = ({ zonas, zonaPreseleccionada, onClose, onSuccess }) => {
    const [modoNuevaZona, setModoNuevaZona] = useState(false);
    const { register, handleSubmit, watch } = useForm({
        defaultValues: { zonaId: zonaPreseleccionada || "" }
    });

    const onSubmit = async (data) => {
        try {
            let finalZonaId = data.zonaId;

            if (modoNuevaZona) {
                const resZona = await api.post('/config/zonas', {
                    provincia: data.provincia,
                    distrito: data.distrito
                });
                finalZonaId = resZona.data.id_zona;
            }

            const resConcepto = await api.post('/config/conceptos', {
                descripcion: data.concepto,
                zonaId: finalZonaId
            });

            alert("✅ Creado exitosamente");
            onSuccess(finalZonaId, resConcepto.data.id_concepto);

        } catch (error) {
            alert("Error al crear: " + (error.response?.data?.error || "Desconocido"));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">Agregar Concepto Rápido</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nuevo Concepto</label>
                        <input {...register("concepto", { required: true })} autoFocus className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Pago Jardinería" />
                    </div>

                    <div className="border-t border-slate-100 my-2"></div>

                    {!modoNuevaZona ? (
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-slate-700">Asignar a Zona</label>
                                <button type="button" onClick={() => setModoNuevaZona(true)} className="text-xs text-blue-600 hover:underline font-bold">+ Crear Nueva Zona</button>
                            </div>
                            <select {...register("zonaId", { required: true })} className="w-full p-2 border rounded bg-white">
                                <option value="">Seleccione Zona...</option>
                                {zonas.map(z => <option key={z.id_zona} value={z.id_zona}>{z.provincia} - {z.distrito}</option>)}
                            </select>
                        </div>
                    ) : (
                        <div className="bg-blue-50 p-3 rounded border border-blue-100">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-blue-800 uppercase">Nueva Zona</h4>
                                <button type="button" onClick={() => setModoNuevaZona(false)} className="text-xs text-slate-500 hover:text-slate-800">Cancelar</button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input {...register("provincia", { required: true })} placeholder="Provincia" className="w-full p-2 border rounded text-sm"/>
                                <input {...register("distrito", { required: true })} placeholder="Distrito" className="w-full p-2 border rounded text-sm"/>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 mt-2 flex justify-center items-center">
                        <Save size={18} className="mr-2"/> Guardar y Usar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Movimientos;