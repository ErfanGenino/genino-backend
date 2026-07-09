-- CreateTable
CREATE TABLE "AmbassadorVendor" (
    "id" SERIAL NOT NULL,
    "ambassadorId" INTEGER NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "ambassadorCode" TEXT NOT NULL,
    "packageId" INTEGER,
    "packageTitle" TEXT,
    "packagePrice" INTEGER NOT NULL DEFAULT 0,
    "ambassadorDiscountAmount" INTEGER NOT NULL DEFAULT 0,
    "subscriptionCommissionBaseAmount" INTEGER NOT NULL DEFAULT 0,
    "subscriptionCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subscriptionCommissionAmount" INTEGER NOT NULL DEFAULT 0,
    "totalSalesAmount" INTEGER NOT NULL DEFAULT 0,
    "salesCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salesCommissionAmount" INTEGER NOT NULL DEFAULT 0,
    "paidCommissionAmount" INTEGER NOT NULL DEFAULT 0,
    "payableCommissionAmount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "subscriptionStartsAt" TIMESTAMP(3),
    "subscriptionEndsAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmbassadorVendor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AmbassadorVendor_ambassadorId_idx" ON "AmbassadorVendor"("ambassadorId");

-- CreateIndex
CREATE INDEX "AmbassadorVendor_vendorId_idx" ON "AmbassadorVendor"("vendorId");

-- CreateIndex
CREATE INDEX "AmbassadorVendor_status_idx" ON "AmbassadorVendor"("status");

-- CreateIndex
CREATE INDEX "AmbassadorVendor_subscriptionEndsAt_idx" ON "AmbassadorVendor"("subscriptionEndsAt");

-- CreateIndex
CREATE INDEX "AmbassadorVendor_releasedAt_idx" ON "AmbassadorVendor"("releasedAt");

-- CreateIndex
CREATE INDEX "AmbassadorVendor_createdAt_idx" ON "AmbassadorVendor"("createdAt");

-- AddForeignKey
ALTER TABLE "AmbassadorVendor" ADD CONSTRAINT "AmbassadorVendor_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "Ambassador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbassadorVendor" ADD CONSTRAINT "AmbassadorVendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
