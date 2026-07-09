-- CreateTable
CREATE TABLE "FinanceSetting" (
    "id" SERIAL NOT NULL,
    "ambassadorVendorDiscountAmount" INTEGER NOT NULL DEFAULT 5000000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceSetting_pkey" PRIMARY KEY ("id")
);
