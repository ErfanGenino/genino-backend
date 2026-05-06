-- CreateTable
CREATE TABLE "MenHealthReport" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "score" TEXT,
    "status" TEXT,
    "tip" TEXT,
    "answers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenHealthReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalorieTracker" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "startDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalorieTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalorieProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "effectiveFrom" TEXT NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "gender" TEXT,
    "age" INTEGER,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "activityLevel" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "idealWeightMin" DOUBLE PRECISION,
    "idealWeightMax" DOUBLE PRECISION,
    "goal" TEXT,
    "maintenanceCalories" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalorieProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalorieDailyLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "dateKey" TEXT NOT NULL,
    "dateText" TEXT NOT NULL,
    "foods" JSONB NOT NULL,
    "calories" JSONB NOT NULL,
    "totalCalories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allowedCalories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalorieDailyLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenHealthReport_userId_createdAt_idx" ON "MenHealthReport"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CalorieTracker_userId_key" ON "CalorieTracker"("userId");

-- CreateIndex
CREATE INDEX "CalorieTracker_userId_idx" ON "CalorieTracker"("userId");

-- CreateIndex
CREATE INDEX "CalorieProfile_userId_idx" ON "CalorieProfile"("userId");

-- CreateIndex
CREATE INDEX "CalorieProfile_userId_effectiveFrom_idx" ON "CalorieProfile"("userId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "CalorieDailyLog_userId_idx" ON "CalorieDailyLog"("userId");

-- CreateIndex
CREATE INDEX "CalorieDailyLog_userId_dateKey_idx" ON "CalorieDailyLog"("userId", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "CalorieDailyLog_userId_dateKey_key" ON "CalorieDailyLog"("userId", "dateKey");

-- AddForeignKey
ALTER TABLE "MenHealthReport" ADD CONSTRAINT "MenHealthReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalorieTracker" ADD CONSTRAINT "CalorieTracker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalorieProfile" ADD CONSTRAINT "CalorieProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalorieDailyLog" ADD CONSTRAINT "CalorieDailyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
