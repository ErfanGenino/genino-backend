-- AlterTable
ALTER TABLE "ChildInvitation" ADD COLUMN     "relationType" TEXT NOT NULL DEFAULT 'relative',
ADD COLUMN     "roleLabel" TEXT,
ADD COLUMN     "slot" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "ChildInvitation_relationType_idx" ON "ChildInvitation"("relationType");
