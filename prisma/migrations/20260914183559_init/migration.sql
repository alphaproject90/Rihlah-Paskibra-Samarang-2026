-- CreateTable
CREATE TABLE "Peserta" (
    "id" TEXT NOT NULL,
    "idPeserta" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "jenisKelamin" TEXT NOT NULL,
    "asalSekolah" TEXT NOT NULL,
    "partisipasi" TEXT NOT NULL,
    "alasanTidakIkut" TEXT,
    "waPribadi" TEXT,
    "waDarurat" TEXT,
    "riwayatMedis" TEXT,
    "waktuBerangkat" TIMESTAMP(3),
    "waktuPulang" TIMESTAMP(3),
    "username" TEXT,
    "passwordHash" TEXT,
    "statusPassword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Peserta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogScan" (
    "id" TEXT NOT NULL,
    "waktuScan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idPeserta" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL,

    CONSTRAINT "LogScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Peserta_idPeserta_key" ON "Peserta"("idPeserta");

-- CreateIndex
CREATE UNIQUE INDEX "Peserta_username_key" ON "Peserta"("username");

-- AddForeignKey
ALTER TABLE "LogScan" ADD CONSTRAINT "LogScan_idPeserta_fkey" FOREIGN KEY ("idPeserta") REFERENCES "Peserta"("idPeserta") ON DELETE RESTRICT ON UPDATE CASCADE;
