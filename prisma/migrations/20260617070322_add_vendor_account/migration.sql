-- CreateTable
CREATE TABLE "VendorAccount" (
    "id" SERIAL NOT NULL,
    "personType" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "mainActivityField" TEXT NOT NULL,
    "extraActivityFields" JSONB,
    "firstName" TEXT,
    "lastName" TEXT,
    "nationalCode" TEXT,
    "birthDate" TIMESTAMP(3),
    "legalCompanyName" TEXT,
    "companyType" TEXT,
    "managerName" TEXT,
    "registrationNumber" TEXT,
    "registrationDate" TIMESTAMP(3),
    "nationalId" TEXT,
    "economicCode" TEXT,
    "businessName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "province" TEXT,
    "city" TEXT,
    "accountStatus" TEXT NOT NULL DEFAULT 'REGISTERED',
    "publishStatus" TEXT NOT NULL DEFAULT 'NOT_ALLOWED',
    "packageStatus" TEXT NOT NULL DEFAULT 'NOT_SELECTED',
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "documentsStatus" TEXT NOT NULL DEFAULT 'NOT_SUBMITTED',
    "reviewStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "packageSelectedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "documentsSubmittedAt" TIMESTAMP(3),
    "reviewStartedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "subscriptionStartsAt" TIMESTAMP(3),
    "subscriptionEndsAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "suspensionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorAccount_email_key" ON "VendorAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VendorAccount_phone_key" ON "VendorAccount"("phone");

-- CreateIndex
CREATE INDEX "VendorAccount_accountStatus_idx" ON "VendorAccount"("accountStatus");

-- CreateIndex
CREATE INDEX "VendorAccount_publishStatus_idx" ON "VendorAccount"("publishStatus");

-- CreateIndex
CREATE INDEX "VendorAccount_packageStatus_idx" ON "VendorAccount"("packageStatus");

-- CreateIndex
CREATE INDEX "VendorAccount_paymentStatus_idx" ON "VendorAccount"("paymentStatus");

-- CreateIndex
CREATE INDEX "VendorAccount_documentsStatus_idx" ON "VendorAccount"("documentsStatus");

-- CreateIndex
CREATE INDEX "VendorAccount_reviewStatus_idx" ON "VendorAccount"("reviewStatus");

-- CreateIndex
CREATE INDEX "VendorAccount_activityType_idx" ON "VendorAccount"("activityType");

-- CreateIndex
CREATE INDEX "VendorAccount_mainActivityField_idx" ON "VendorAccount"("mainActivityField");

-- CreateIndex
CREATE INDEX "VendorAccount_province_idx" ON "VendorAccount"("province");

-- CreateIndex
CREATE INDEX "VendorAccount_city_idx" ON "VendorAccount"("city");

-- CreateIndex
CREATE INDEX "VendorAccount_createdAt_idx" ON "VendorAccount"("createdAt");
