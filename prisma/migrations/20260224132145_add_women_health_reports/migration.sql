-- CreateTable
CREATE TABLE "WomenHealthReport" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "answers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WomenHealthReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WomenHealthReport_userId_createdAt_idx" ON "WomenHealthReport"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "WomenHealthReport" ADD CONSTRAINT "WomenHealthReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
