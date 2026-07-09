-- AlterTable
ALTER TABLE "VendorAccount" ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "bankInfoConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bankInfoConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "cardNumber" TEXT,
ADD COLUMN     "contractAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contractAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "shebaNumber" TEXT;
