-- CreateTable
CREATE TABLE "Administrador" (
    "numeroEconomico" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "password" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Alumno" (
    "matricula" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "correo" TEXT,
    "telefono" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'En espera'
);

-- CreateTable
CREATE TABLE "Uea" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "grupo" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Horario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idUea" INTEGER NOT NULL,
    "dia" TEXT NOT NULL,
    "inicio" TEXT NOT NULL,
    "fin" TEXT NOT NULL,
    CONSTRAINT "Horario_idUea_fkey" FOREIGN KEY ("idUea") REFERENCES "Uea" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ampliacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matricula" TEXT NOT NULL,
    "idUea" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "solicitud" TEXT,
    CONSTRAINT "Ampliacion_matricula_fkey" FOREIGN KEY ("matricula") REFERENCES "Alumno" ("matricula") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ampliacion_idUea_fkey" FOREIGN KEY ("idUea") REFERENCES "Uea" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Uea_clave_grupo_key" ON "Uea"("clave", "grupo");

-- CreateIndex
CREATE UNIQUE INDEX "Horario_idUea_dia_inicio_fin_key" ON "Horario"("idUea", "dia", "inicio", "fin");

-- CreateIndex
CREATE UNIQUE INDEX "Ampliacion_matricula_idUea_key" ON "Ampliacion"("matricula", "idUea");
