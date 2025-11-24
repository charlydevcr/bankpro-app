/*
  Warnings:

  - You are about to drop the column `descripcion_extra` on the `Movimiento` table. All the data in the column will be lost.
  - You are about to drop the `Plantilla` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Cuenta" DROP CONSTRAINT "Cuenta_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "Movimiento" DROP CONSTRAINT "Movimiento_cuentaIban_fkey";

-- AlterTable
ALTER TABLE "Movimiento" DROP COLUMN "descripcion_extra";

-- DropTable
DROP TABLE "Plantilla";

-- CreateTable
CREATE TABLE "Usuario" (
    "id_usuario" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- AddForeignKey
ALTER TABLE "Cuenta" ADD CONSTRAINT "Cuenta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id_cliente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_cuentaIban_fkey" FOREIGN KEY ("cuentaIban") REFERENCES "Cuenta"("iban") ON DELETE CASCADE ON UPDATE CASCADE;
