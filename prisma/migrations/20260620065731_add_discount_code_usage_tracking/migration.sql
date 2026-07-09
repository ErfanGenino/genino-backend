-- AlterTable
ALTER TABLE "DiscountCode" ADD COLUMN     "usedAt" TIMESTAMP(3),
ADD COLUMN     "usedByVendorId" INTEGER;

-- CreateIndex
CREATE INDEX "DiscountCode_usedByVendorId_idx" ON "DiscountCode"("usedByVendorId");

-- AddForeignKey
ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_usedByVendorId_fkey" FOREIGN KEY ("usedByVendorId") REFERENCES "VendorAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
