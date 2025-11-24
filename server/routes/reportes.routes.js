// server/routes/reportes.routes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Obtener Estado de Cuenta Completo
router.get('/:iban', async (req, res) => {
    const { iban } = req.params;

    try {
        const cuenta = await prisma.cuenta.findUnique({
            where: { iban },
            include: {
                cliente: true, // Traer datos del dueño
                movimientos: { // Traer movimientos ordenados
                    include: { tipoDocumento: true, concepto: true },
                    orderBy: { fecha_movimiento: 'desc' }
                }
            }
        });

        if (!cuenta) {
            return res.status(404).json({ error: 'Cuenta no encontrada' });
        }

        // Calcular totales para el resumen
        const totalCreditos = cuenta.movimientos
            .filter(m => m.tipo_operacion === 'C')
            .reduce((sum, m) => sum + Number(m.monto), 0);

        const totalDebitos = cuenta.movimientos
            .filter(m => m.tipo_operacion === 'D')
            .reduce((sum, m) => sum + Number(m.monto), 0);

        res.json({
            ...cuenta,
            resumen: {
                total_creditos: totalCreditos,
                total_debitos: totalDebitos
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error generando reporte' });
    }
});

module.exports = router;