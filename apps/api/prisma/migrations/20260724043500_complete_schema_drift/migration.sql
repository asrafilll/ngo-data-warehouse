-- AlterTable
ALTER TABLE "Mustahik"
ADD COLUMN "profileComplete" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "RutinDisbursement"
ADD COLUMN "canceledAt" TIMESTAMP(3),
ADD COLUMN "canceledBy" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "channel" TEXT NOT NULL,
    "program" TEXT NOT NULL DEFAULT 'Umum',
    "note" TEXT NOT NULL DEFAULT '',
    "donatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Donation_donorId_idx" ON "Donation"("donorId");

-- AddForeignKey
ALTER TABLE "Donation"
ADD CONSTRAINT "Donation_donorId_fkey"
FOREIGN KEY ("donorId") REFERENCES "Donor"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
