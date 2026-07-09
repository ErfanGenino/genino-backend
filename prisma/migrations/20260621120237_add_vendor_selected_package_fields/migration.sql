-- AlterTable
ALTER TABLE "VendorAccount" ADD COLUMN     "selectedAmbassadorCode" TEXT,
ADD COLUMN     "selectedAmbassadorDiscountAmount" INTEGER,
ADD COLUMN     "selectedAmbassadorName" TEXT,
ADD COLUMN     "selectedDiscountCode" TEXT,
ADD COLUMN     "selectedDiscountPercent" INTEGER,
ADD COLUMN     "selectedPackageFinalPrice" INTEGER,
ADD COLUMN     "selectedPackageId" INTEGER,
ADD COLUMN     "selectedPackagePrice" INTEGER,
ADD COLUMN     "selectedPackageTitle" TEXT;
