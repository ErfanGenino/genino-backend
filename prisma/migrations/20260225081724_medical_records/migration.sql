-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "doctor" TEXT,
    "category" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalAttachment" (
    "id" SERIAL NOT NULL,
    "recordId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicalRecord_userId_recordDate_idx" ON "MedicalRecord"("userId", "recordDate");

-- CreateIndex
CREATE INDEX "MedicalRecord_userId_category_idx" ON "MedicalRecord"("userId", "category");

-- CreateIndex
CREATE INDEX "MedicalAttachment_recordId_idx" ON "MedicalAttachment"("recordId");

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalAttachment" ADD CONSTRAINT "MedicalAttachment_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
