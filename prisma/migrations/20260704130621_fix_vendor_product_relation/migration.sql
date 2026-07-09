-- AlterTable
ALTER TABLE "VendorAccount" ADD COLUMN     "usedProductCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "VendorProduct" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT,
    "brandFa" TEXT,
    "brandEn" TEXT,
    "material" TEXT,
    "mainImageIndex" INTEGER NOT NULL DEFAULT 0,
    "categoryLinks" JSONB NOT NULL,
    "inventoryRows" JSONB NOT NULL,
    "gender" JSONB NOT NULL,
    "seasons" JSONB NOT NULL,
    "ageRanges" JSONB NOT NULL,
    "madeInCountry" TEXT,
    "weight" TEXT,
    "length" TEXT,
    "width" TEXT,
    "height" TEXT,
    "hasWarranty" TEXT,
    "warrantyPeriod" TEXT,
    "warrantyUnit" TEXT,
    "standards" JSONB NOT NULL,
    "careInstructions" JSONB NOT NULL,
    "careNote" TEXT,
    "images" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorProduct_vendorId_idx" ON "VendorProduct"("vendorId");

-- CreateIndex
CREATE INDEX "VendorProduct_status_idx" ON "VendorProduct"("status");

-- AddForeignKey
ALTER TABLE "VendorProduct" ADD CONSTRAINT "VendorProduct_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
