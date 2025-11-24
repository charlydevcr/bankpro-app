// server/routes/usuarios.routes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// --- LISTAR TODOS LOS USUARIOS ---
router.get('/', async (req, res) => {
    try {
        // Devolvemos todos menos la contraseña por seguridad
        const usuarios = await prisma.usuario.findMany({
            select: {
                id_usuario: true,
                nombre: true,
                correo: true,
                rol: true,
                creado_en: true
            },
            orderBy: { creado_en: 'desc' }
        });
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo usuarios' });
    }
});

// --- CREAR NUEVO USUARIO (Solo Admin debería llamar esto) ---
router.post('/', async (req, res) => {
    const { nombre, correo, password, rol } = req.body;

    if (!nombre || !correo || !password || !rol) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        // Verificar duplicado
        const existe = await prisma.usuario.findUnique({ where: { correo } });
        if (existe) return res.status(400).json({ error: 'El correo ya está registrado' });

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        const nuevoUsuario = await prisma.usuario.create({
            data: {
                nombre,
                correo,
                password: hashedPassword,
                rol // 'ADMIN' o 'OPERADOR'
            }
        });

        // No devolvemos la password
        const { password: _, ...usuarioSinPass } = nuevoUsuario;
        res.json(usuarioSinPass);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creando usuario' });
    }
});

// --- ELIMINAR USUARIO ---
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.usuario.delete({
            where: { id_usuario: parseInt(id) }
        });
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error eliminando usuario' });
    }
});

module.exports = router;