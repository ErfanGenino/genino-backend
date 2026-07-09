-- CreateTable
CREATE TABLE "VendorNotification" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorNotification_vendorId_idx" ON "VendorNotification"("vendorId");

-- CreateIndex
CREATE INDEX "VendorNotification_vendorId_read_idx" ON "VendorNotification"("vendorId", "read");

-- CreateIndex
CREATE INDEX "VendorNotification_createdAt_idx" ON "VendorNotification"("createdAt");

-- CreateIndex
CREATE INDEX "VendorNotification_type_idx" ON "VendorNotification"("type");

-- AddForeignKey
ALTER TABLE "VendorNotification" ADD CONSTRAINT "VendorNotification_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
