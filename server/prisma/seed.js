// server/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando carga masiva de datos...');

  // --------------------------------------------------------
  // 1. USUARIO ADMIN
  // --------------------------------------------------------
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.usuario.upsert({
    where: { correo: 'admin@bankpro.com' },
    update: {},
    create: {
      nombre: 'Administrador Principal',
      correo: 'admin@bankpro.com',
      password: passwordHash,
      rol: 'ADMIN'
    }
  });
  console.log('👤 Usuario Admin confirmado.');

  // --------------------------------------------------------
  // 2. TIPOS DE DOCUMENTO
  // --------------------------------------------------------
  const tipos = [
    { codigo: 'DEP', descripcion: 'Depósito Ventanilla' },
    { codigo: 'RET', descripcion: 'Retiro de Efectivo' },
    { codigo: 'TRF', descripcion: 'Transferencia SINPE' },
    { codigo: 'INT', descripcion: 'Intereses Ganados' },
    { codigo: 'COM', descripcion: 'Comisión Bancaria' }
  ];

  for (const tipo of tipos) {
    await prisma.tipoDocumento.upsert({
      where: { codigo: tipo.codigo },
      update: {},
      create: tipo
    });
  }
  console.log('📄 Tipos de documento cargados.');

  // --------------------------------------------------------
  // 3. ZONAS Y CONCEPTOS
  // --------------------------------------------------------
  // Zona 1
  const zonaSJ = await prisma.zona.upsert({
    where: { provincia_distrito: { provincia: 'San José', distrito: 'Central' } },
    update: {},
    create: { provincia: 'San José', distrito: 'Central' }
  });

  // Conceptos SJ
  await prisma.concepto.createMany({
    data: [
      { descripcion: 'Pago Planilla', zonaId: zonaSJ.id_zona },
      { descripcion: 'Pago Alquiler', zonaId: zonaSJ.id_zona },
      { descripcion: 'Supermercado', zonaId: zonaSJ.id_zona }
    ],
    skipDuplicates: true
  });

  // Zona 2
  const zonaGua = await prisma.zona.upsert({
    where: { provincia_distrito: { provincia: 'Guanacaste', distrito: 'Liberia' } },
    update: {},
    create: { provincia: 'Guanacaste', distrito: 'Liberia' }
  });
  
  // Conceptos Guanacaste
  await prisma.concepto.createMany({
    data: [
      { descripcion: 'Hospedaje Hotel', zonaId: zonaGua.id_zona },
      { descripcion: 'Transporte', zonaId: zonaGua.id_zona }
    ],
    skipDuplicates: true
  });
  console.log('🌍 Zonas y Conceptos cargados.');

  // --------------------------------------------------------
  // 4. CLIENTE DEMO Y CUENTA
  // --------------------------------------------------------
  // Verificar si ya existe para no duplicar
  const clienteExiste = await prisma.cliente.findUnique({ where: { cedula: '1-1122-3344' } });

  if (!clienteExiste) {
    // Creamos cliente, cuenta y movimientos de un solo golpe
    await prisma.cliente.create({
      data: {
        nombre: 'Carlos Rodríguez',
        cedula: '1-1122-3344',
        correo: 'carlos@demo.com',
        telefono: '8888-8888',
        cuentas: {
          create: {
            iban: 'CR001230000111222333',
            num_cuenta_bancaria: '100-01-000-1',
            tipo_cuenta: 'Ahorros',
            moneda: 'CRC',
            saldo_inicial: 0,
            saldo_actual: 450000, // Saldo final calculado
            movimientos: {
              create: [
                {
                  tipoDocumentoId: 1, // DEP
                  conceptoId: 1,      // Pago Planilla
                  num_documento: '1001',
                  tipo_operacion: 'C',
                  monto: 500000,
                  fecha_movimiento: new Date('2025-11-01T12:00:00Z'),
                  fecha_contable: new Date('2025-11-01T12:00:00Z')
                },
                {
                  tipoDocumentoId: 3, // TRF
                  conceptoId: 2,      // Pago Alquiler
                  num_documento: '1002',
                  tipo_operacion: 'D',
                  monto: 150000,
                  fecha_movimiento: new Date('2025-11-05T12:00:00Z'),
                  fecha_contable: new Date('2025-11-05T12:00:00Z')
                },
                {
                  tipoDocumentoId: 2, // RET
                  conceptoId: 3,      // Supermercado
                  num_documento: '1003',
                  tipo_operacion: 'D',
                  monto: 35000,
                  fecha_movimiento: new Date('2025-11-10T12:00:00Z'),
                  fecha_contable: new Date('2025-11-10T12:00:00Z'),
                  tarjeta: '**** 4242'
                },
                {
                  tipoDocumentoId: 1, // DEP
                  conceptoId: 1,      // Pago Planilla (Quincena)
                  num_documento: '1004',
                  tipo_operacion: 'C',
                  monto: 135000,
                  fecha_movimiento: new Date('2025-11-15T12:00:00Z'),
                  fecha_contable: new Date('2025-11-15T12:00:00Z')
                }
              ]
            }
          }
        }
      }
    });
    console.log('👤 Cliente Demo creado con movimientos.');
  } else {
    console.log('ℹ️ El cliente demo ya existía, se omitió creación.');
  }

  console.log('✅ ¡Carga masiva completada!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });