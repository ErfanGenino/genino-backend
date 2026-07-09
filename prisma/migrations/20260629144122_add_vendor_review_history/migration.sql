-- CreateEnum
CREATE TYPE "VendorReviewAction" AS ENUM ('SUBMITTED', 'CORRECTION_REQUESTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "VendorReviewHistory" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "adminId" INTEGER,
    "action" "VendorReviewAction" NOT NULL,
    "message" TEXT,
    "correctionFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorReviewHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorReviewHistory_vendorId_idx" ON "VendorReviewHistory"("vendorId");

-- CreateIndex
CREATE INDEX "VendorReviewHistory_adminId_idx" ON "VendorReviewHistory"("adminId");

-- CreateIndex
CREATE INDEX "VendorReviewHistory_action_idx" ON "VendorReviewHistory"("action");

-- CreateIndex
CREATE INDEX "VendorReviewHistory_createdAt_idx" ON "VendorReviewHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "VendorReviewHistory" ADD CONSTRAINT "VendorReviewHistory_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorReviewHistory" ADD CONSTRAINT "VendorReviewHistory_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
