-- CreateTable
CREATE TABLE "InspirationItem" (
    "id" SERIAL NOT NULL,
    "mode" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "author" TEXT,
    "exerciseTitle" TEXT NOT NULL,
    "exerciseText" TEXT NOT NULL,
    "durationSec" INTEGER NOT NULL DEFAULT 180,
    "reflectionQuestion" TEXT NOT NULL,
    "reflectionHint" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspirationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspirationAction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "dateKey" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspirationAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InspirationItem_mode_idx" ON "InspirationItem"("mode");

-- CreateIndex
CREATE INDEX "InspirationItem_isActive_idx" ON "InspirationItem"("isActive");

-- CreateIndex
CREATE INDEX "InspirationAction_userId_idx" ON "InspirationAction"("userId");

-- CreateIndex
CREATE INDEX "InspirationAction_dateKey_idx" ON "InspirationAction"("dateKey");

-- CreateIndex
CREATE INDEX "InspirationAction_mode_idx" ON "InspirationAction"("mode");

-- CreateIndex
CREATE UNIQUE INDEX "InspirationAction_userId_dateKey_mode_key" ON "InspirationAction"("userId", "dateKey", "mode");

-- AddForeignKey
ALTER TABLE "InspirationAction" ADD CONSTRAINT "InspirationAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
