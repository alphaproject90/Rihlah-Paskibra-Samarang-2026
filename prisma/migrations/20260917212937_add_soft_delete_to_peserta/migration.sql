-- AlterTable
ALTER TABLE "Peserta" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Peserta_deletedAt_idx" ON "Peserta"("deletedAt");
