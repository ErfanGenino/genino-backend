-- CreateEnum
CREATE TYPE "VendorDocumentType" AS ENUM ('NATIONAL_CARD', 'SELFIE_WITH_NATIONAL_CARD', 'BANK_DOCUMENT', 'BUSINESS_LICENSE', 'COMPANY_OFFICIAL_NEWSPAPER', 'COMPANY_REGISTRATION', 'REPRESENTATIVE_LETTER', 'OTHER');

-- CreateTable
CREATE TABLE "VendorDocument" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "type" "VendorDocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorDocument_vendorId_idx" ON "VendorDocument"("vendorId");

-- CreateIndex
CREATE INDEX "VendorDocument_type_idx" ON "VendorDocument"("type");

-- CreateIndex
CREATE INDEX "VendorDocument_status_idx" ON "VendorDocument"("status");

-- CreateIndex
CREATE INDEX "VendorDocument_createdAt_idx" ON "VendorDocument"("createdAt");

-- AddForeignKey
ALTER TABLE "VendorDocument" ADD CONSTRAINT "VendorDocument_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
