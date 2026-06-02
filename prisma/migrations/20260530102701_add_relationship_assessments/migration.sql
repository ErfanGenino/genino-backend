-- CreateTable
CREATE TABLE "RelationshipAssessment" (
    "id" SERIAL NOT NULL,
    "lifeCompanionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "strongestCategory" TEXT,
    "growthCategory" TEXT,
    "answers" JSONB NOT NULL,
    "categoryScores" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelationshipAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RelationshipAssessment_lifeCompanionId_idx" ON "RelationshipAssessment"("lifeCompanionId");

-- CreateIndex
CREATE INDEX "RelationshipAssessment_userId_idx" ON "RelationshipAssessment"("userId");

-- CreateIndex
CREATE INDEX "RelationshipAssessment_completedAt_idx" ON "RelationshipAssessment"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipAssessment_lifeCompanionId_userId_completedAt_key" ON "RelationshipAssessment"("lifeCompanionId", "userId", "completedAt");

-- AddForeignKey
ALTER TABLE "RelationshipAssessment" ADD CONSTRAINT "RelationshipAssessment_lifeCompanionId_fkey" FOREIGN KEY ("lifeCompanionId") REFERENCES "LifeCompanion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipAssessment" ADD CONSTRAINT "RelationshipAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
