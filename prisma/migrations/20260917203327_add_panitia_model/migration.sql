-- CreateEnum
CREATE TYPE "RolePanitia" AS ENUM ('SUPER_ADMIN', 'ADMIN_MOBIL');

-- AlterTable
ALTER TABLE "Peserta" ADD COLUMN     "mobil" TEXT;

-- CreateTable
CREATE TABLE "Panitia" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "role" "RolePanitia" NOT NULL,
    "mobil" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Panitia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Panitia_username_key" ON "Panitia"("username");

-- CreateIndex
CREATE INDEX "Panitia_username_idx" ON "Panitia"("username");

-- CreateIndex
CREATE INDEX "Panitia_role_idx" ON "Panitia"("role");
