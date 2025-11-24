// server/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();
const SECRET_KEY = 'secreto_super_seguro_bancario'; 

// --- CONFIGURACIÓN DEL TRANSPORTE DE CORREO (GMAIL) ---
// Nota: Si no configuras esto con datos reales, el envío fallará, 
// pero el sistema usará el modo "Consola" para que puedas trabajar.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'TU_CORREO_REAL@gmail.com', 
    pass: 'TU_PASS_DE_APLICACION'       
  }
});

// --- LOGIN ---
router.post('/login', async (req, res) => {
    const { correo, password } = req.body;
    try {
        const usuario = await prisma.usuario.findUnique({ where: { correo } });
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        const validPassword = await bcrypt.compare(password, usuario.password);
        if (!validPassword) return res.status(401).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign({ id: usuario.id_usuario, rol: usuario.rol, nombre: usuario.nombre }, SECRET_KEY, { expiresIn: '8h' });

        res.json({ message: 'Login exitoso', token, usuario: { id: usuario.id_usuario, nombre: usuario.nombre, rol: usuario.rol } });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// --- SOLICITAR RECUPERACIÓN (MODO TOLERANTE A FALLOS) ---
router.post('/forgot-password', async (req, res) => {
    const { correo } = req.body;
    try {
        const usuario = await prisma.usuario.findUnique({ where: { correo } });
        if (!usuario) {
            // Por seguridad, simulamos éxito aunque no exista
            return res.json({ message: 'Si el correo existe, se enviará un enlace.' });
        }

        // 1. Generar y Guardar Token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

        await prisma.usuario.update({
            where: { correo },
            data: { resetToken, resetTokenExpiry }
        });

        // 2. Crear Link
        const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

        // 3. Intentar enviar correo (Try/Catch interno)
        try {
            await transporter.sendMail({
                from: '"Soporte BankPro" <no-reply@bankpro.com>',
                to: correo,
                subject: 'Recuperación de Contraseña - BankPro',
                html: `Clic aquí para recuperar: <a href="${resetLink}">${resetLink}</a>`
            });
            console.log(`✅ Correo enviado a ${correo}`);
        } catch (mailError) {
            // Si falla el envío (porque no configuraste credenciales), NO DETENEMOS EL PROCESO.
            // Lo mostramos en consola para que el desarrollador (tú) pueda usar el link.
            console.log("⚠️ =========================================");
            console.log("⚠️ AVISO: El correo no se pudo enviar (Faltan credenciales SMTP)");
            console.log("⚠️ UTILIZA ESTE LINK MANUALMENTE:");
            console.log(`👉 ${resetLink}`);
            console.log("⚠️ =========================================");
        }

        // Siempre respondemos éxito al frontend para que avance la pantalla
        res.json({ message: 'Se ha enviado un enlace de recuperación a su correo.' });

    } catch (error) {
        console.error("Error general:", error);
        res.status(500).json({ error: 'Error procesando solicitud' });
    }
});

// --- RESTABLECER CONTRASEÑA ---
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        const usuario = await prisma.usuario.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() }
            }
        });

        if (!usuario) return res.status(400).json({ error: 'Token inválido o expirado' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.usuario.update({
            where: { id_usuario: usuario.id_usuario },
            data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null }
        });

        res.json({ message: 'Contraseña actualizada correctamente.' });

    } catch (error) {
        res.status(500).json({ error: 'Error restableciendo contraseña' });
    }
});

module.exports = router;