-- CreateTable
CREATE TABLE "VendorPackage" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "hasDedicatedPage" BOOLEAN NOT NULL DEFAULT true,
    "windowCount" INTEGER,
    "achievementLimit" INTEGER,
    "durationMonths" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorPackage_code_key" ON "VendorPackage"("code");

-- CreateIndex
CREATE INDEX "VendorPackage_code_idx" ON "VendorPackage"("code");

-- CreateIndex
CREATE INDEX "VendorPackage_isActive_idx" ON "VendorPackage"("isActive");

-- CreateIndex
CREATE INDEX "VendorPackage_sortOrder_idx" ON "VendorPackage"("sortOrder");
