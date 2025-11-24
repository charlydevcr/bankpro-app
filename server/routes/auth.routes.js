// server/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();
// En producción, esto debería venir de process.env.SECRET_KEY
const SECRET_KEY = process.env.SECRET_KEY || 'secreto_super_seguro_bancario'; 

// --- CONFIGURACIÓN DEL TRANSPORTE DE CORREO ---
// Usa variables de entorno para seguridad en producción
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'TU_CORREO_REAL@gmail.com', 
    pass: process.env.SMTP_PASS || 'TU_PASS_DE_APLICACION'       
  }
});

// --- LOGIN ---
router.post('/login', async (req, res) => {
    const { correo, password } = req.body;

    try {
        const usuario = await prisma.usuario.findUnique({ where: { correo } });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const validPassword = await bcrypt.compare(password, usuario.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        const token = jwt.sign(
            { id: usuario.id_usuario, rol: usuario.rol, nombre: usuario.nombre },
            SECRET_KEY,
            { expiresIn: '8h' } 
        );

        res.json({
            message: 'Login exitoso',
            token,
            usuario: {
                id: usuario.id_usuario,
                nombre: usuario.nombre,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// --- SOLICITAR RECUPERACIÓN (FORGOT PASSWORD) ---
router.post('/forgot-password', async (req, res) => {
    const { correo } = req.body;
    try {
        const usuario = await prisma.usuario.findUnique({ where: { correo } });
        
        // Por seguridad no revelamos si el correo existe o no, pero validamos internamente
        if (!usuario) {
            return res.json({ message: 'Si el correo existe, se enviará un enlace.' });
        }

        // 1. Generar token random
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora de validez

        // 2. Guardar en BD
        await prisma.usuario.update({
            where: { correo },
            data: { resetToken, resetTokenExpiry }
        });

        // 3. Crear Link Dinámico (Producción vs Local)
        // Si estamos en Railway, usamos la variable FRONTEND_URL. Si no, localhost.
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

        // 4. Intentar enviar correo
        try {
            await transporter.sendMail({
                from: '"Soporte BankPro" <no-reply@bankpro.com>',
                to: correo,
                subject: 'Recuperación de Contraseña - BankPro',
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
                        <h2 style="color: #2563eb;">Recuperación de Acceso</h2>
                        <p>Hola <strong>${usuario.nombre}</strong>,</p>
                        <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
                        <p>Haz clic en el botón de abajo para continuar:</p>
                        <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; font-weight: bold;">Restablecer Contraseña</a>
                        <p style="margin-top: 30px; font-size: 12px; color: #666;">O copia y pega este enlace en tu navegador:</p>
                        <p style="font-size: 12px; color: #666;">${resetLink}</p>
                        <p style="margin-top: 20px; font-size: 12px; color: #999;">Si no solicitaste esto, ignora este correo. El enlace expirará en 1 hora.</p>
                    </div>
                `
            });
            console.log(`✅ Correo enviado a ${correo}`);
        } catch (mailError) {
            console.log("⚠️ Error enviando correo (Revisa credenciales SMTP):", mailError.message);
            console.log("⚠️ Link manual para desarrollo:", resetLink);
        }

        res.json({ message: 'Se ha enviado un enlace de recuperación a su correo.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error procesando solicitud' });
    }
});

// --- RESTABLECER CONTRASEÑA (RESET PASSWORD) ---
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        // Buscar usuario con ese token válido y no expirado
        const usuario = await prisma.usuario.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() } // gt = greater than (mayor que ahora)
            }
        });

        if (!usuario) {
            return res.status(400).json({ error: 'El enlace es inválido o ha expirado.' });
        }

        // Encriptar nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar usuario y limpiar token para que no se use dos veces
        await prisma.usuario.update({
            where: { id_usuario: usuario.id_usuario },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        res.json({ message: 'Contraseña actualizada correctamente. Ahora puedes iniciar sesión.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error restableciendo contraseña' });
    }
});

module.exports = router;