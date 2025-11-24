// server/routes/clientes.routes.js

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// --- 1. OBTENER TODOS LOS CLIENTES (GET) ---
router.get('/', async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        cuentas: true, // Trae también las cuentas asociadas
      },
      orderBy: {
        creado_en: 'desc', // Del más nuevo al más viejo
      }
    });
    res.json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los clientes' });
  }
});

// --- 2. CREAR UN NUEVO CLIENTE (POST) ---
router.post('/', async (req, res) => {
  try {
    const { nombre, cedula, telefono, correo } = req.body;

    // Validaciones básicas
    if (!nombre || !cedula || !correo) {
      return res.status(400).json({ error: 'Nombre, Cédula y Correo son obligatorios' });
    }

    // Verificar si ya existe
    const existe = await prisma.cliente.findFirst({
        where: {
            OR: [
                { cedula: cedula },
                { correo: correo }
            ]
        }
    });

    if (existe) {
        return res.status(400).json({ error: 'Ya existe un cliente con esa cédula o correo' });
    }

    // Crear en Base de Datos
    const nuevoCliente = await prisma.cliente.create({
      data: {
        nombre,
        cedula,
        telefono,
        correo,
      },
    });

    res.json(nuevoCliente);
  } catch (error) {
    console.error("Error creando cliente:", error);
    res.status(500).json({ error: 'Error interno del servidor al crear cliente' });
  }
});

// --- 3. ELIMINAR CLIENTE (DELETE) ---
// IMPORTANTE: Gracias a "onDelete: Cascade" en el Schema, 
// esto borrará automáticamente sus cuentas y los movimientos de esas cuentas.
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.cliente.delete({
            where: { id_cliente: parseInt(id) }
        });
        res.json({ message: 'Cliente y toda su información (cuentas/movimientos) eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
});

module.exports = router;