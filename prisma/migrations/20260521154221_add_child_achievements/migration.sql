-- CreateTable
CREATE TABLE "ChildAchievement" (
    "id" SERIAL NOT NULL,
    "childId" INTEGER NOT NULL,
    "issuerUserId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "issuerRole" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChildAchievement_childId_idx" ON "ChildAchievement"("childId");

-- CreateIndex
CREATE INDEX "ChildAchievement_issuerUserId_idx" ON "ChildAchievement"("issuerUserId");

-- CreateIndex
CREATE INDEX "ChildAchievement_category_idx" ON "ChildAchievement"("category");

-- CreateIndex
CREATE INDEX "ChildAchievement_issuedAt_idx" ON "ChildAchievement"("issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChildAchievement_childId_issuerUserId_category_key" ON "ChildAchievement"("childId", "issuerUserId", "category");

-- AddForeignKey
ALTER TABLE "ChildAchievement" ADD CONSTRAINT "ChildAchievement_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildAchievement" ADD CONSTRAINT "ChildAchievement_issuerUserId_fkey" FOREIGN KEY ("issuerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
