-- CreateTable
CREATE TABLE "Cliente" (
    "id_cliente" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "telefono" TEXT,
    "correo" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "Cuenta" (
    "id_cuenta" SERIAL NOT NULL,
    "iban" TEXT NOT NULL,
    "num_cuenta_bancaria" TEXT NOT NULL,
    "tipo_cuenta" TEXT NOT NULL,
    "moneda" TEXT NOT NULL,
    "saldo_inicial" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "saldo_actual" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteId" INTEGER NOT NULL,

    CONSTRAINT "Cuenta_pkey" PRIMARY KEY ("id_cuenta")
);

-- CreateTable
CREATE TABLE "Movimiento" (
    "id_movimiento" SERIAL NOT NULL,
    "num_documento" TEXT NOT NULL,
    "tipo_operacion" TEXT NOT NULL,
    "fecha_movimiento" TIMESTAMP(3) NOT NULL,
    "fecha_contable" TIMESTAMP(3) NOT NULL,
    "tarjeta" TEXT,
    "monto" DECIMAL(15,2) NOT NULL,
    "descripcion_extra" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cuentaIban" TEXT NOT NULL,
    "tipoDocumentoId" INTEGER NOT NULL,
    "conceptoId" INTEGER NOT NULL,

    CONSTRAINT "Movimiento_pkey" PRIMARY KEY ("id_movimiento")
);

-- CreateTable
CREATE TABLE "TipoDocumento" (
    "id_tipo" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "consecutivo_actual" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TipoDocumento_pkey" PRIMARY KEY ("id_tipo")
);

-- CreateTable
CREATE TABLE "Zona" (
    "id_zona" SERIAL NOT NULL,
    "provincia" TEXT NOT NULL,
    "distrito" TEXT NOT NULL,

    CONSTRAINT "Zona_pkey" PRIMARY KEY ("id_zona")
);

-- CreateTable
CREATE TABLE "Concepto" (
    "id_concepto" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "zonaId" INTEGER NOT NULL,

    CONSTRAINT "Concepto_pkey" PRIMARY KEY ("id_concepto")
);

-- CreateTable
CREATE TABLE "Plantilla" (
    "id_plantilla" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "json_diseno" JSONB NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plantilla_pkey" PRIMARY KEY ("id_plantilla")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_cedula_key" ON "Cliente"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_correo_key" ON "Cliente"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Cuenta_iban_key" ON "Cuenta"("iban");

-- CreateIndex
CREATE UNIQUE INDEX "Cuenta_num_cuenta_bancaria_key" ON "Cuenta"("num_cuenta_bancaria");

-- CreateIndex
CREATE UNIQUE INDEX "Movimiento_tipoDocumentoId_num_documento_key" ON "Movimiento"("tipoDocumentoId", "num_documento");

-- CreateIndex
CREATE UNIQUE INDEX "TipoDocumento_codigo_key" ON "TipoDocumento"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Zona_provincia_distrito_key" ON "Zona"("provincia", "distrito");

-- AddForeignKey
ALTER TABLE "Cuenta" ADD CONSTRAINT "Cuenta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_cuentaIban_fkey" FOREIGN KEY ("cuentaIban") REFERENCES "Cuenta"("iban") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_tipoDocumentoId_fkey" FOREIGN KEY ("tipoDocumentoId") REFERENCES "TipoDocumento"("id_tipo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_conceptoId_fkey" FOREIGN KEY ("conceptoId") REFERENCES "Concepto"("id_concepto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Concepto" ADD CONSTRAINT "Concepto_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "Zona"("id_zona") ON DELETE RESTRICT ON UPDATE CASCADE;
