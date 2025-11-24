import React, { useState, useEffect } from 'react';
import { FileText, Printer, Search } from 'lucide-react';
import api from '../api/axios';

// --- LOGO BCR VECTORIAL (SVG) PARA IMPRESIÓN NÍTIDA ---
const LogoBCR = () => (
  <svg viewBox="0 0 300 100" className="h-12 w-auto">
    {/* Parte Roja */}
    <path fill="#E30613" d="M0,20 h60 v60 h-60 z" />
    {/* Letras BCR (Simuladas para no cargar fuentes externas) */}
    <g transform="translate(70, 80)" fill="#002F87" style={{ fontFamily: 'Arial, sans-serif', fontWeight: '900', fontStyle: 'italic' }}>
        <text fontSize="80" x="0" y="0" letterSpacing="-5">BCR</text>
    </g>
    <text x="75" y="95" fill="#002F87" fontSize="14" fontFamily="Arial" fontWeight="bold">Banco de Costa Rica</text>
  </svg>
);

const PrintableStatement = ({ data }) => {
    if (!data) return null;

    const formatMoney = (amount) => {
        return parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
    };

    return (
      <div id="printable-area" className="bg-white text-black font-sans text-[10px] mx-auto max-w-[21.59cm]">
        {/* Tabla Maestra para control de paginación */}
        <table className="w-full">
            
            {/* --- HEADER (Se repite en cada hoja) --- */}
            <thead>
                <tr>
                    <td colSpan="7">
                        <div className="pb-2 pt-4 px-6">
                            {/* Fila 1: Logo y Título Central */}
                            <div className="flex justify-between items-start relative">
                                <div>
                                    <LogoBCR />
                                    <p className="text-[10px] font-bold mt-1 ml-1">Cédula Jurídica : 4-000-000019</p>
                                </div>
                                <div className="absolute left-0 right-0 top-2 text-center">
                                    <h1 className="text-2xl font-bold font-serif tracking-wide">Estado de Cuenta</h1>
                                    <p className="text-[11px] font-bold mt-1">VISA / MASTERCARD</p>
                                </div>
                            </div>

                            {/* Fila 2: Datos del Cliente y Periodo */}
                            <div className="flex mt-6">
                                {/* Columna Izquierda: Cliente e IBAN */}
                                <div className="w-2/3 pr-4">
                                    <div className="flex mb-2">
                                        <span className="font-bold w-16 text-[11px]">Sr (a) :</span>
                                        <span className="font-bold text-[11px]">{data.cliente.nombre.toUpperCase()}</span>
                                    </div>
                                    
                                    <div className="mt-4 space-y-1">
                                        <p className="font-bold text-[11px]">{data.iban}</p>
                                        <p className="font-bold text-[11px]">Cuenta IBAN</p>
                                        <p className="font-bold text-[11px] mt-3">{data.num_cuenta_bancaria} {data.moneda === 'CRC' ? 'COLONES' : data.moneda}</p>
                                        <p className="font-bold text-[11px]">Cuenta de {data.tipo_cuenta}</p>
                                    </div>
                                </div>

                                {/* Columna Derecha: Fechas */}
                                <div className="w-1/3 pl-8 pt-1">
                                    <div className="mb-1">
                                        <p className="font-bold text-[10px]">Período de Corte</p>
                                        <p className="font-bold text-[10px]">01/08/{new Date().getFullYear()} al {new Date().toLocaleDateString()}</p>
                                    </div>
                                    <div className="mt-2">
                                        <p className="font-bold text-[10px]">Ciclo de Corte : 5</p>
                                    </div>
                                </div>
                            </div>

                            {/* LÍNEA ROJA DIVISORIA */}
                            <div className="w-full h-[3px] bg-[#E30613] mt-4 mb-1"></div>

                            {/* SALDO ANTERIOR (Alineado a la derecha exacto) */}
                            <div className="flex justify-end items-center py-1 mb-1">
                                <div className="w-1/2 border-b-2 border-[#002F87] flex justify-end pb-1">
                                    <span className="font-bold mr-8 text-[11px]">Saldo Anterior :</span>
                                    <span className="font-bold text-[12px]">{formatMoney(data.saldo_inicial)}</span>
                                </div>
                            </div>

                            {/* ENCABEZADOS DE COLUMNA (Azul oscuro) */}
                            <div className="flex w-full bg-[#F5F5F5] border-b border-gray-300 py-2 mt-2">
                                <div className="w-[10%] text-[#002F87] font-bold text-center text-[9px] leading-tight">Fecha<br/>Movimiento</div>
                                <div className="w-[10%] text-[#002F87] font-bold text-center text-[9px] leading-tight">Fecha<br/>Contable</div>
                                <div className="w-[8%] text-[#002F87] font-bold text-center text-[9px]">Tarjeta</div>
                                <div className="w-[12%] text-[#002F87] font-bold text-center text-[9px]">Documento</div>
                                <div className="w-[36%] text-[#002F87] font-bold text-center text-[9px]">Concepto</div>
                                <div className="w-[12%] text-[#002F87] font-bold text-right text-[9px]">Monto Débito</div>
                                <div className="w-[12%] text-[#002F87] font-bold text-right pr-4 text-[9px]">Monto Crédito</div>
                            </div>
                        </div>
                    </td>
                </tr>
            </thead>

            {/* --- BODY (Datos) --- */}
            <tbody className="text-[10px]">
                {data.movimientos.map((mov, index) => (
                    <tr key={index} className="align-top hover:bg-gray-50">
                        <td className="py-1 text-center pl-6">{formatDate(mov.fecha_movimiento)}</td>
                        <td className="py-1 text-center">{formatDate(mov.fecha_contable)}</td>
                        <td className="py-1 text-center">{mov.tarjeta || ''}</td>
                        <td className="py-1 text-center">{mov.num_documento}</td>
                        <td className="py-1 px-1">
                            {mov.concepto.descripcion}
                            {mov.tipoDocumento.codigo !== 'TRF' && ` - ${mov.tipoDocumento.descripcion}`}
                        </td>
                        <td className="py-1 text-right pr-4">
                            {mov.tipo_operacion === 'D' ? formatMoney(mov.monto) : ''}
                        </td>
                        <td className="py-1 text-right pr-6">
                            {mov.tipo_operacion === 'C' ? formatMoney(mov.monto) : ''}
                        </td>
                    </tr>
                ))}
                
                {/* Relleno si está vacío */}
                {data.movimientos.length === 0 && (
                    <tr><td colSpan="7" className="text-center py-10 italic text-gray-400">Sin movimientos registrados en este periodo.</td></tr>
                )}
            </tbody>

            {/* --- FOOTER (Totales y Tasas) --- */}
            <tfoot>
                <tr>
                    <td colSpan="7">
                        <div className="px-6 mt-2">
                            {/* Línea divisoria superior */}
                            <div className="border-t border-black mb-1"></div>
                            
                            {/* TOTALES DEBITO / CREDITO */}
                            <div className="flex justify-end text-[11px] mb-2">
                                <div className="text-right">
                                    <span className="font-bold mr-4">Débitos / Créditos:</span>
                                    <span className="inline-block w-24 text-right">{formatMoney(data.resumen.total_debitos)}</span>
                                    <span className="inline-block w-24 text-right mr-6">{formatMoney(data.resumen.total_creditos)}</span>
                                </div>
                            </div>

                            {/* SALDO FINAL */}
                            <div className="flex justify-end">
                                <div className="border-t-2 border-[#002F87] w-1/2 pt-1 flex justify-end items-center">
                                    <span className="font-bold mr-12 text-[12px]">Saldo Final :</span>
                                    <span className="font-bold text-[13px] mr-6">{formatMoney(data.saldo_actual)}</span>
                                </div>
                            </div>

                            {/* TABLA DE TASAS (Diseño Idéntico) */}
                            <div className="mt-10 break-inside-avoid">
                                <div className="text-center mb-2">
                                    <p className="font-bold text-[10px]">Tasa de interés sujeta a variaciones</p>
                                    <p className="font-bold text-[10px]">RANGOS SEGÚN SALDO EN CUENTAS</p>
                                </div>

                                <div className="max-w-md mx-auto">
                                    {/* Header Tasas */}
                                    <div className="flex justify-between border-b-2 border-gray-800 pb-1 mb-1 font-bold text-[10px]">
                                        <span className="pl-2">** Rangos **</span>
                                        <span className="pr-2">Tasa</span>
                                    </div>
                                    {/* Body Tasas */}
                                    <div className="text-[10px] space-y-1">
                                        <div className="flex justify-between px-2"><span>Desde 0.00 hasta ¢25,000</span><span>1.1100%</span></div>
                                        <div className="flex justify-between px-2"><span>Más de ¢25,000 hasta ¢100,000</span><span>1.2100%</span></div>
                                        <div className="flex justify-between px-2"><span>Más de ¢100,000 hasta ¢500,000</span><span>1.3200%</span></div>
                                        <div className="flex justify-between px-2"><span>Más de ¢500,000 hasta ¢1,000,000</span><span>1.4300%</span></div>
                                        <div className="flex justify-between px-2"><span>Más de ¢1,000,000 hasta ¢5,000,000</span><span>1.5400%</span></div>
                                        <div className="flex justify-between px-2"><span>Más de ¢5,000,000 en adelante</span><span>1.7500%</span></div>
                                    </div>
                                    <div className="border-t border-gray-800 mt-1"></div>
                                </div>
                            </div>

                            {/* Pie de página técnico */}
                            <div className="flex justify-between text-[8px] text-black mt-12 pt-2 border-t border-black">
                                <span>Pág. 1 de 1</span>
                                <span>{new Date().toLocaleString()}</span>
                                <span>Impreso por: BCR\AccesoReportesPer</span>
                            </div>
                        </div>
                    </td>
                </tr>
            </tfoot>
        </table>
      </div>
    );
};

// --- LOGICA PRINCIPAL ---
const Reportes = () => {
  const [clientes, setClientes] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('');
  const [reportData, setReportData] = useState(null);
  
  const handlePrint = () => window.print();

  useEffect(() => {
    api.get('/clientes').then(res => setClientes(res.data));
  }, []);

  const handleClienteChange = (e) => {
      const cliente = clientes.find(c => c.id_cliente === parseInt(e.target.value));
      setCuentas(cliente ? cliente.cuentas : []);
      setReportData(null);
  };

  const generarReporte = async () => {
      if(!cuentaSeleccionada) return;
      try {
          const res = await api.get(`/reportes/${cuentaSeleccionada}`);
          setReportData(res.data);
      } catch (error) {
          alert("Error generando reporte");
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8 font-sans">
      
      {/* PANEL DE CONTROL (Se oculta al imprimir) */}
      <div className="w-full md:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-24 no-print">
        <h1 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
            <FileText className="mr-2" /> Generador
        </h1>
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                <select onChange={handleClienteChange} className="w-full p-2 border rounded bg-white">
                    <option value="">Seleccione cliente...</option>
                    {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cuenta Bancaria</label>
                <select onChange={(e) => setCuentaSeleccionada(e.target.value)} className="w-full p-2 border rounded bg-white" disabled={!cuentas.length}>
                    <option value="">Seleccione cuenta...</option>
                    {cuentas.map(c => <option key={c.iban} value={c.iban}>{c.iban} ({c.moneda})</option>)}
                </select>
            </div>
            <button onClick={generarReporte} disabled={!cuentaSeleccionada} className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition disabled:bg-slate-300">
                Vista Previa
            </button>
            {reportData && (
                <button onClick={handlePrint} className="w-full bg-red-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-red-700 transition flex items-center justify-center mt-4">
                    <Printer className="mr-2" /> Imprimir Estado de Cuenta
                </button>
            )}
        </div>
      </div>

      {/* VISTA PREVIA (Hoja Carta) */}
      <div className="w-full md:w-2/3 bg-gray-300 p-8 rounded-xl overflow-auto flex justify-center border border-slate-400">
        {reportData ? (
            <div className="shadow-2xl bg-white" style={{ width: '21.59cm', minHeight: '27.94cm' }}>
                <PrintableStatement data={reportData} />
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 h-96">
                <Search size={64} className="opacity-20 mb-4" />
                <p>Seleccione una cuenta para generar el reporte</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;