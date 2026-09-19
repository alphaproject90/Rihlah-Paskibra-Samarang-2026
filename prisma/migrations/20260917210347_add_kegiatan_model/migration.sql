-- CreateTable
CREATE TABLE "Kegiatan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kegiatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbsenKegiatan" (
    "id" TEXT NOT NULL,
    "kegiatanId" TEXT NOT NULL,
    "idPeserta" TEXT NOT NULL,
    "waktuAbsen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dicatatOleh" TEXT,

    CONSTRAINT "AbsenKegiatan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Kegiatan_aktif_idx" ON "Kegiatan"("aktif");

-- CreateIndex
CREATE INDEX "AbsenKegiatan_kegiatanId_idx" ON "AbsenKegiatan"("kegiatanId");

-- CreateIndex
CREATE INDEX "AbsenKegiatan_idPeserta_idx" ON "AbsenKegiatan"("idPeserta");

-- CreateIndex
CREATE UNIQUE INDEX "AbsenKegiatan_kegiatanId_idPeserta_key" ON "AbsenKegiatan"("kegiatanId", "idPeserta");

-- AddForeignKey
ALTER TABLE "AbsenKegiatan" ADD CONSTRAINT "AbsenKegiatan_kegiatanId_fkey" FOREIGN KEY ("kegiatanId") REFERENCES "Kegiatan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenKegiatan" ADD CONSTRAINT "AbsenKegiatan_idPeserta_fkey" FOREIGN KEY ("idPeserta") REFERENCES "Peserta"("idPeserta") ON DELETE CASCADE ON UPDATE CASCADE;
