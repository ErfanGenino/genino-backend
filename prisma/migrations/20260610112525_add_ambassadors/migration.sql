-- CreateTable
CREATE TABLE "Ambassador" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "ambassadorCode" TEXT NOT NULL,
    "fatherName" TEXT,
    "birthCertificateNumber" TEXT,
    "education" TEXT,
    "maritalStatus" TEXT,
    "childrenCount" INTEGER,
    "currentJob" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "familiarWithGenino" TEXT,
    "marketingExperience" TEXT,
    "dailyVisitAbility" TEXT,
    "successReason" TEXT,
    "personalPhotoUrl" TEXT,
    "nationalCardImageUrl" TEXT,
    "birthCertificateImageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "level" TEXT NOT NULL DEFAULT 'NEW',
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "customersCount" INTEGER NOT NULL DEFAULT 0,
    "invitedUsersCount" INTEGER NOT NULL DEFAULT 0,
    "totalCommission" INTEGER NOT NULL DEFAULT 0,
    "paidCommission" INTEGER NOT NULL DEFAULT 0,
    "payableCommission" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ambassador_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ambassador_userId_key" ON "Ambassador"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Ambassador_ambassadorCode_key" ON "Ambassador"("ambassadorCode");

-- CreateIndex
CREATE INDEX "Ambassador_ambassadorCode_idx" ON "Ambassador"("ambassadorCode");

-- CreateIndex
CREATE INDEX "Ambassador_status_idx" ON "Ambassador"("status");

-- CreateIndex
CREATE INDEX "Ambassador_level_idx" ON "Ambassador"("level");

-- CreateIndex
CREATE INDEX "Ambassador_createdAt_idx" ON "Ambassador"("createdAt");

-- AddForeignKey
ALTER TABLE "Ambassador" ADD CONSTRAINT "Ambassador_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
