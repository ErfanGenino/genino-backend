-- CreateTable
CREATE TABLE "LifeEvent" (
    "id" SERIAL NOT NULL,
    "lifeCompanionId" INTEGER NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "eventTime" TEXT,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedById" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LifeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LifeEvent_lifeCompanionId_idx" ON "LifeEvent"("lifeCompanionId");

-- CreateIndex
CREATE INDEX "LifeEvent_creatorId_idx" ON "LifeEvent"("creatorId");

-- CreateIndex
CREATE INDEX "LifeEvent_eventDate_idx" ON "LifeEvent"("eventDate");

-- CreateIndex
CREATE INDEX "LifeEvent_completed_idx" ON "LifeEvent"("completed");

-- CreateIndex
CREATE INDEX "LifeEvent_createdAt_idx" ON "LifeEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "LifeEvent" ADD CONSTRAINT "LifeEvent_lifeCompanionId_fkey" FOREIGN KEY ("lifeCompanionId") REFERENCES "LifeCompanion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifeEvent" ADD CONSTRAINT "LifeEvent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
