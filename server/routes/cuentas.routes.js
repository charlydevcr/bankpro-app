// server/routes/cuentas.routes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// --- 1. CREAR NUEVA CUENTA (POST) ---
router.post('/', async (req, res) => {
    try {
        const { clienteId, iban, num_cuenta_bancaria, tipo_cuenta, moneda, saldo_inicial } = req.body;

        // Validaciones básicas
        if (!clienteId || !iban || !num_cuenta_bancaria) {
            return res.status(400).json({ error: 'Faltan datos obligatorios (Cliente, IBAN o Num. Cuenta)' });
        }

        // Verificar que el IBAN no exista ya
        const existeIban = await prisma.cuenta.findUnique({
            where: { iban: iban }
        });

        if (existeIban) {
            return res.status(400).json({ error: 'Ese IBAN ya está registrado en el sistema.' });
        }

        // Crear la cuenta
        const nuevaCuenta = await prisma.cuenta.create({
            data: {
                clienteId: parseInt(clienteId),
                iban,
                num_cuenta_bancaria,
                tipo_cuenta,
                moneda,
                saldo_inicial: saldo_inicial || 0,
                saldo_actual: saldo_inicial || 0 
            }
        });

        res.json(nuevaCuenta);

    } catch (error) {
        console.error("Error creando cuenta:", error);
        res.status(500).json({ error: 'Error interno al crear la cuenta.' });
    }
});

// --- 2. ELIMINAR CUENTA (DELETE) ---
// IMPORTANTE: Gracias a "onDelete: Cascade" en el Schema,
// esto borrará automáticamente todos los movimientos de esta cuenta.
router.delete('/:iban', async (req, res) => {
    try {
        const { iban } = req.params;
        
        await prisma.cuenta.delete({
            where: { iban: iban }
        });

        res.json({ message: 'Cuenta y sus movimientos eliminados correctamente' });
    } catch (error) {
        console.error("Error eliminando cuenta:", error);
        res.status(500).json({ error: 'Error al eliminar la cuenta' });
    }
});

module.exports = router;