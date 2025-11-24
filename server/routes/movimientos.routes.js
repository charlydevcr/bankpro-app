// server/routes/movimientos.routes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// --- CONFIGURACIÓN ---
router.get('/config', async (req, res) => {
    try {
        const tipos = await prisma.tipoDocumento.findMany({ orderBy: { codigo: 'asc' } });
        const zonas = await prisma.zona.findMany({ orderBy: { provincia: 'asc' } }); // Corregido para traer zonas
        res.json({ tipos, zonas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error cargando configuración' });
    }
});

// --- CONCEPTOS POR ZONA ---
router.get('/conceptos/:zonaId', async (req, res) => {
    const { zonaId } = req.params;
    try {
        const conceptos = await prisma.concepto.findMany({ 
            where: { zonaId: parseInt(zonaId) },
            orderBy: { descripcion: 'asc' } 
        });
        res.json(conceptos);
    } catch (error) {
        res.status(500).json({ error: 'Error cargando conceptos' });
    }
});

// --- CONSECUTIVO ---
router.get('/siguiente-numero/:id_tipo', async (req, res) => {
    const { id_tipo } = req.params;
    try {
        const tipo = await prisma.tipoDocumento.findUnique({
            where: { id_tipo: parseInt(id_tipo) }
        });
        if (!tipo) return res.status(404).json({ error: 'Tipo no encontrado' });
        res.json({ siguiente: tipo.consecutivo_actual + 1 });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo consecutivo' });
    }
});

// --- OBTENER MOVIMIENTOS ---
router.get('/:iban', async (req, res) => {
    const { iban } = req.params;
    try {
        const movimientos = await prisma.movimiento.findMany({
            where: { cuentaIban: iban },
            include: { tipoDocumento: true, concepto: true }, // Prisma incluye zonaId dentro de concepto por defecto
            orderBy: { fecha_movimiento: 'desc' }
        });
        res.json(movimientos);
    } catch (error) {
        res.status(500).json({ error: 'Error cargando movimientos' });
    }
});

// --- REGISTRAR MOVIMIENTO (POST) ---
router.post('/', async (req, res) => {
    const { iban, tipo_documento_id, concepto_id, tipo_operacion, monto, referencia, fecha_movimiento, fecha_contable, num_documento } = req.body;

    if (!iban || !monto || !tipo_operacion || !fecha_movimiento || !fecha_contable || !num_documento) {
        return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    const fMov = new Date(fecha_movimiento + "T12:00:00Z");
    const fCon = new Date(fecha_contable + "T12:00:00Z");
    
    if (fCon.toISOString().split('T')[0] < fMov.toISOString().split('T')[0]) {
        return res.status(400).json({ error: 'La Fecha Contable no puede ser anterior a la Fecha del Movimiento.' });
    }

    try {
        const resultado = await prisma.$transaction(async (tx) => {
            const idTipoDoc = parseInt(tipo_documento_id);
            const idConcepto = parseInt(concepto_id);

            const existeDoc = await tx.movimiento.findFirst({
                where: {
                    tipoDocumentoId: idTipoDoc,
                    num_documento: num_documento.toString()
                }
            });

            if (existeDoc) throw new Error(`El documento número ${num_documento} ya existe.`);

            const cuenta = await tx.cuenta.findUnique({ where: { iban } });
            if (!cuenta) throw new Error("Cuenta no encontrada");

            const montoDecimal = parseFloat(monto);
            let nuevoSaldo = parseFloat(cuenta.saldo_actual); 

            if (tipo_operacion === 'C') nuevoSaldo += montoDecimal;
            else nuevoSaldo -= montoDecimal;

            if (nuevoSaldo < 0) throw new Error("Fondos insuficientes (Saldo negativo).");

            const tipoDoc = await tx.tipoDocumento.findUnique({ where: { id_tipo: idTipoDoc }});
            if (parseInt(num_documento) > tipoDoc.consecutivo_actual) {
                await tx.tipoDocumento.update({
                    where: { id_tipo: idTipoDoc },
                    data: { consecutivo_actual: parseInt(num_documento) }
                });
            }

            const movimientoCreado = await tx.movimiento.create({
                data: {
                    cuentaIban: iban,
                    tipoDocumentoId: idTipoDoc,
                    conceptoId: idConcepto,
                    num_documento: num_documento.toString(),
                    tipo_operacion,
                    monto: montoDecimal,
                    fecha_movimiento: fMov,
                    fecha_contable: fCon,
                    tarjeta: referencia || null
                }
            });

            await tx.cuenta.update({
                where: { iban },
                data: { saldo_actual: nuevoSaldo }
            });

            return movimientoCreado;
        });
        res.json({ message: 'Exitoso', data: resultado });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// --- EDITAR MOVIMIENTO (PUT) - NUEVO ---
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { monto, concepto_id, tipo_documento_id, num_documento, fecha_movimiento, fecha_contable, referencia, tipo_operacion } = req.body;

    // Validaciones básicas
    const fMov = new Date(fecha_movimiento + "T12:00:00Z");
    const fCon = new Date(fecha_contable + "T12:00:00Z");

    if (fCon.toISOString().split('T')[0] < fMov.toISOString().split('T')[0]) {
        return res.status(400).json({ error: 'Fecha contable inválida.' });
    }

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Obtener el movimiento ORIGINAL (Antes de editar)
            const movOriginal = await tx.movimiento.findUnique({
                where: { id_movimiento: parseInt(id) }
            });
            if (!movOriginal) throw new Error("Movimiento no encontrado");

            const cuenta = await tx.cuenta.findUnique({ where: { iban: movOriginal.cuentaIban } });
            
            // 2. REVERTIR SALDO (Deshacer lo que hizo el original)
            let saldoTemporal = Number(cuenta.saldo_actual);
            if (movOriginal.tipo_operacion === 'C') {
                saldoTemporal -= Number(movOriginal.monto); // Quitamos el crédito
            } else {
                saldoTemporal += Number(movOriginal.monto); // Devolvemos el débito
            }

            // 3. APLICAR NUEVO SALDO (Con los datos nuevos)
            // Nota: Permitimos editar el monto y el tipo de operación si se desea
            const nuevoMonto = Number(monto);
            
            if (tipo_operacion === 'C') {
                saldoTemporal += nuevoMonto;
            } else {
                saldoTemporal -= nuevoMonto;
            }

            // 4. Validar si el resultado final es negativo
            if (saldoTemporal < 0) {
                throw new Error("La edición generaría un saldo negativo en la cuenta.");
            }

            // 5. Verificar duplicados si cambió el número o tipo de documento
            if (num_documento !== movOriginal.num_documento || parseInt(tipo_documento_id) !== movOriginal.tipoDocumentoId) {
                 const existeDoc = await tx.movimiento.findFirst({
                    where: {
                        tipoDocumentoId: parseInt(tipo_documento_id),
                        num_documento: num_documento.toString(),
                        NOT: { id_movimiento: parseInt(id) } // Excluirse a sí mismo
                    }
                });
                if (existeDoc) throw new Error(`El documento ${num_documento} ya existe para ese tipo.`);
            }

            // 6. Actualizar Movimiento
            await tx.movimiento.update({
                where: { id_movimiento: parseInt(id) },
                data: {
                    monto: nuevoMonto,
                    tipo_operacion: tipo_operacion,
                    conceptoId: parseInt(concepto_id),
                    tipoDocumentoId: parseInt(tipo_documento_id),
                    num_documento: num_documento.toString(),
                    fecha_movimiento: fMov,
                    fecha_contable: fCon,
                    tarjeta: referencia || null
                }
            });

            // 7. Actualizar Cuenta
            await tx.cuenta.update({
                where: { iban: movOriginal.cuentaIban },
                data: { saldo_actual: saldoTemporal }
            });
        });

        res.json({ message: 'Movimiento actualizado correctamente' });

    } catch (error) {
        console.error("Error PUT:", error);
        res.status(400).json({ error: error.message });
    }
});

// --- ELIMINAR MOVIMIENTO ---
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.$transaction(async (tx) => {
            const movimiento = await tx.movimiento.findUnique({
                where: { id_movimiento: parseInt(id) }
            });

            if (!movimiento) throw new Error("Movimiento no encontrado");

            const cuenta = await tx.cuenta.findUnique({
                where: { iban: movimiento.cuentaIban }
            });

            let nuevoSaldo = Number(cuenta.saldo_actual);
            const monto = Number(movimiento.monto);

            if (movimiento.tipo_operacion === 'C') {
                nuevoSaldo -= monto;
            } else {
                nuevoSaldo += monto;
            }

            if (nuevoSaldo < 0) {
                throw new Error("Eliminar este movimiento dejaría la cuenta en negativo.");
            }

            await tx.movimiento.delete({
                where: { id_movimiento: parseInt(id) }
            });

            await tx.cuenta.update({
                where: { iban: movimiento.cuentaIban },
                data: { saldo_actual: nuevoSaldo }
            });
        });

        res.json({ message: 'Eliminado correctamente' });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;