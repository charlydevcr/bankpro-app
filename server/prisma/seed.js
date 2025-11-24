// server/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); // Importante para encriptar
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando carga de datos...');

  // 1. Datos Base (Tipos, Zonas...) - Mantenemos lo previo
  await prisma.tipoDocumento.upsert({
    where: { codigo: 'DEP' },
    update: {},
    create: { codigo: 'DEP', descripcion: 'Depósito Bancario' },
  });
  // ... (puedes dejar el resto de tus seeds aquí si quieres)

  // 2. CREAR USUARIO ADMIN
  const emailAdmin = 'admin@bankpro.com';
  // Encriptar contraseña "admin123"
  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.usuario.upsert({
      where: { correo: emailAdmin },
      update: {},
      create: {
          nombre: 'Administrador Principal',
          correo: emailAdmin,
          password: passwordHash,
          rol: 'ADMIN'
      }
  });

  console.log(`✅ Usuario Admin creado: ${emailAdmin} / pass: admin123`);
  console.log('✅ Datos base cargados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });