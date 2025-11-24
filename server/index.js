// server/index.js
const express = require('express');
const cors = require('cors');

// --- IMPORTACIÓN DE RUTAS ---
const authRoutes = require('./routes/auth.routes.js');
const clientesRoutes = require('./routes/clientes.routes.js');
const cuentasRoutes = require('./routes/cuentas.routes.js');
const movimientosRoutes = require('./routes/movimientos.routes.js');
const reportesRoutes = require('./routes/reportes.routes.js');
const configuracionRoutes = require('./routes/configuracion.routes.js');
const usuariosRoutes = require('./routes/usuarios.routes.js');

const app = express();
const PORT = process.env.PORT || 3001;

// --- CONFIGURACIÓN CORS (CRÍTICO PARA PRODUCCIÓN) ---
// Esto permite que tu Frontend en Vercel hable con este Backend en Railway
app.use(cors({
    origin: '*', // Permite el acceso desde cualquier dominio
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para entender JSON
app.use(express.json());

// --- DEFINICIÓN DE ENDPOINTS ---
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/cuentas', cuentasRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/config', configuracionRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Ruta de prueba para verificar que el server vive
app.get('/', (req, res) => {
    res.send('✅ API BankPro funcionando correctamente en la nube ☁️');
});

// --- INICIO DEL SERVIDOR ---
app.listen(PORT, () => {
    console.log(`------------------------------------------------`);
    console.log(`✅ Servidor API corriendo en puerto: ${PORT}`);
    console.log(`------------------------------------------------`);
});