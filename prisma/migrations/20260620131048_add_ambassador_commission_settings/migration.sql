-- AlterTable
ALTER TABLE "FinanceSetting" ADD COLUMN     "ambassadorSalesCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "ambassadorSubscriptionCommissionPercent" INTEGER NOT NULL DEFAULT 50;
