-- CreateTable
CREATE TABLE "Dokumen" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "idPeserta" TEXT,
    "blobUrl" TEXT NOT NULL,
    "blobDownloadUrl" TEXT NOT NULL,
    "blobPathname" TEXT NOT NULL,
    "ukuranByte" INTEGER,
    "diunggahOleh" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dokumen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dokumen_scope_idx" ON "Dokumen"("scope");

-- CreateIndex
CREATE INDEX "Dokumen_idPeserta_idx" ON "Dokumen"("idPeserta");

-- AddForeignKey
ALTER TABLE "Dokumen" ADD CONSTRAINT "Dokumen_idPeserta_fkey" FOREIGN KEY ("idPeserta") REFERENCES "Peserta"("idPeserta") ON DELETE SET NULL ON UPDATE CASCADE;
