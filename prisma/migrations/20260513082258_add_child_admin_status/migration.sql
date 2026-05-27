-- AlterTable
ALTER TABLE "ChildAdmin" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" INTEGER,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "requestedRole" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'CONNECTED';
