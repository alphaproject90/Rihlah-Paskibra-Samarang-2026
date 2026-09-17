-- CreateTable
CREATE TABLE "ResetPasswordRequest" (
    "id" TEXT NOT NULL,
    "idPeserta" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "noWaTujuan" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "otpEncrypted" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "sentBy" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResetPasswordRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResetPasswordRequest_idPeserta_idx" ON "ResetPasswordRequest"("idPeserta");

-- CreateIndex
CREATE INDEX "ResetPasswordRequest_status_idx" ON "ResetPasswordRequest"("status");

-- CreateIndex
CREATE INDEX "ResetPasswordRequest_expiresAt_idx" ON "ResetPasswordRequest"("expiresAt");

-- AddForeignKey
ALTER TABLE "ResetPasswordRequest" ADD CONSTRAINT "ResetPasswordRequest_idPeserta_fkey" FOREIGN KEY ("idPeserta") REFERENCES "Peserta"("idPeserta") ON DELETE CASCADE ON UPDATE CASCADE;
