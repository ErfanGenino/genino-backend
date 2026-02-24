-- CreateTable
CREATE TABLE "WomenCycle" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "lastPeriodAt" TIMESTAMP(3) NOT NULL,
    "cycleLength" INTEGER NOT NULL DEFAULT 28,
    "periodLength" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WomenCycle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WomenCycle_userId_key" ON "WomenCycle"("userId");

-- CreateIndex
CREATE INDEX "WomenCycle_userId_idx" ON "WomenCycle"("userId");

-- AddForeignKey
ALTER TABLE "WomenCycle" ADD CONSTRAINT "WomenCycle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
