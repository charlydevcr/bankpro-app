// server/index.js
const express = require('express');
const cors = require('cors');

// Imports
const clientesRoutes = require('./routes/clientes.routes.js');
const cuentasRoutes = require('./routes/cuentas.routes.js');
const movimientosRoutes = require('./routes/movimientos.routes.js');
const reportesRoutes = require('./routes/reportes.routes.js');
const configuracionRoutes = require('./routes/configuracion.routes.js'); // <--- NUEVO
const authRoutes = require('./routes/auth.routes.js'); // <--- NUEVO
const usuariosRoutes = require('./routes/usuarios.routes.js'); // <--- NUEVO

// Configuración
const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/clientes', clientesRoutes);
app.use('/api/cuentas', cuentasRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/config', configuracionRoutes); // <--- NUEVO
app.use('/api/auth', authRoutes); // <--- NUEVO
app.use('/api/usuarios', usuariosRoutes); // <--- NUEVO

// Test
app.get('/', (req, res) => {
    res.send('¡API del Generador Bancario funcionando correctamente! 🚀');
});

// Iniciar
app.listen(PORT, () => {
    console.log(`------------------------------------------------`);
    console.log(`✅ Servidor API corriendo en: http://localhost:${PORT}`);
    console.log(`------------------------------------------------`);
});