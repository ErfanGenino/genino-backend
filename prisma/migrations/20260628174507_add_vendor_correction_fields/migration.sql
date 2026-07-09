-- AlterTable
ALTER TABLE "VendorAccount" ADD COLUMN     "correctionFields" TEXT[] DEFAULT ARRAY[]::TEXT[];
