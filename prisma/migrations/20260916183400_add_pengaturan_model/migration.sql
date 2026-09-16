-- CreateTable
CREATE TABLE "Pengaturan" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "pendaftaranDibuka" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedOleh" TEXT,

    CONSTRAINT "Pengaturan_pkey" PRIMARY KEY ("id")
);
