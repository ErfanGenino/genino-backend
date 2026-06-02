-- AlterTable
ALTER TABLE "MedicalRecord" ADD COLUMN     "childId" INTEGER;

-- CreateIndex
CREATE INDEX "MedicalRecord_childId_recordDate_idx" ON "MedicalRecord"("childId", "recordDate");

-- CreateIndex
CREATE INDEX "MedicalRecord_childId_category_idx" ON "MedicalRecord"("childId", "category");

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
