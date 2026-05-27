-- AlterTable
ALTER TABLE "ChildInvitation" ADD COLUMN     "targetUserId" INTEGER;

-- CreateIndex
CREATE INDEX "ChildInvitation_targetUserId_idx" ON "ChildInvitation"("targetUserId");

-- AddForeignKey
ALTER TABLE "ChildInvitation" ADD CONSTRAINT "ChildInvitation_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
