// server/routes/configuracion.routes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ==========================================
// 1. GESTIÓN DE TIPOS DE DOCUMENTO
// ==========================================
router.get('/tipos', async (req, res) => {
    const tipos = await prisma.tipoDocumento.findMany({ orderBy: { codigo: 'asc' } });
    res.json(tipos);
});

router.post('/tipos', async (req, res) => {
    const { codigo, descripcion } = req.body;
    try {
        const nuevo = await prisma.tipoDocumento.create({
            data: { codigo: codigo.toUpperCase(), descripcion }
        });
        res.json(nuevo);
    } catch (error) {
        res.status(400).json({ error: 'Error creando tipo (¿Código duplicado?)' });
    }
});

router.delete('/tipos/:id', async (req, res) => {
    try {
        await prisma.tipoDocumento.delete({ where: { id_tipo: parseInt(req.params.id) } });
        res.json({ message: 'Eliminado' });
    } catch (error) {
        res.status(400).json({ error: 'No se puede eliminar (Está en uso)' });
    }
});

// ==========================================
// 2. GESTIÓN DE ZONAS
// ==========================================
router.get('/zonas', async (req, res) => {
    const zonas = await prisma.zona.findMany({ orderBy: { provincia: 'asc' } });
    res.json(zonas);
});

router.post('/zonas', async (req, res) => {
    const { provincia, distrito } = req.body;
    try {
        const nueva = await prisma.zona.create({
            data: { provincia, distrito }
        });
        res.json(nueva);
    } catch (error) {
        res.status(400).json({ error: 'Error creando zona (Posible duplicado)' });
    }
});

// --- NUEVO: CARGA MASIVA DE ZONAS ---
router.post('/zonas/masivo', async (req, res) => {
    // items: [{ provincia: "San José", distrito: "Pavas" }, ...]
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Lista vacía o formato incorrecto' });
    }

    try {
        // createMany es muy eficiente. skipDuplicates evita errores si ya existe la zona.
        const resultado = await prisma.zona.createMany({
            data: items,
            skipDuplicates: true
        });

        res.json({ message: `Proceso completado. Se registraron ${resultado.count} zonas nuevas.` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en carga masiva de zonas: ' + error.message });
    }
});

router.delete('/zonas/:id', async (req, res) => {
    try {
        await prisma.zona.delete({ where: { id_zona: parseInt(req.params.id) } });
        res.json({ message: 'Eliminado' });
    } catch (error) {
        res.status(400).json({ error: 'No se puede eliminar (Tiene conceptos asociados)' });
    }
});


// ==========================================
// 3. GESTIÓN DE CONCEPTOS
// ==========================================
router.get('/conceptos', async (req, res) => {
    const { zonaId } = req.query;
    const whereClause = zonaId ? { zonaId: parseInt(zonaId) } : {};
    const conceptos = await prisma.concepto.findMany({
        where: whereClause,
        include: { zona: true },
        orderBy: { descripcion: 'asc' }
    });
    res.json(conceptos);
});

router.post('/conceptos', async (req, res) => {
    const { descripcion, zonaId } = req.body;
    try {
        const nuevo = await prisma.concepto.create({
            data: { descripcion, zonaId: parseInt(zonaId) }
        });
        res.json(nuevo);
    } catch (error) {
        res.status(400).json({ error: 'Error creando concepto' });
    }
});

// --- CARGA MASIVA CONCEPTOS (Mantenemos la lógica híbrida anterior) ---
router.post('/conceptos/masivo', async (req, res) => {
    const { items, zonaIdGlobal } = req.body; 
    
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Lista vacía' });
    }

    try {
        let procesados = 0;

        await prisma.$transaction(async (tx) => {
            for (const item of items) {
                let idZonaFinal = null;

                if (zonaIdGlobal) {
                    idZonaFinal = parseInt(zonaIdGlobal);
                } else if (item.provincia && item.distrito) {
                    let zonaExistente = await tx.zona.findFirst({
                        where: {
                            provincia: { equals: item.provincia, mode: 'insensitive' },
                            distrito: { equals: item.distrito, mode: 'insensitive' }
                        }
                    });

                    if (zonaExistente) {
                        idZonaFinal = zonaExistente.id_zona;
                    } else {
                        const nuevaZona = await tx.zona.create({
                            data: { provincia: item.provincia, distrito: item.distrito }
                        });
                        idZonaFinal = nuevaZona.id_zona;
                    }
                }

                if (idZonaFinal && item.concepto) {
                    await tx.concepto.create({
                        data: {
                            descripcion: item.concepto,
                            zonaId: idZonaFinal,
                            estado: true
                        }
                    });
                    procesados++;
                }
            }
        });

        res.json({ message: `Proceso completado. Se registraron ${procesados} conceptos.` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en la carga masiva: ' + error.message });
    }
});

router.delete('/conceptos/:id', async (req, res) => {
    try {
        await prisma.concepto.delete({ where: { id_concepto: parseInt(req.params.id) } });
        res.json({ message: 'Eliminado' });
    } catch (error) {
        res.status(400).json({ error: 'No se puede eliminar (Está en uso)' });
    }
});

module.exports = router;