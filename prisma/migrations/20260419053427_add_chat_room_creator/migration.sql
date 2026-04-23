-- AlterTable
ALTER TABLE "ChatRoom" ADD COLUMN     "creatorId" INTEGER;

-- CreateIndex
CREATE INDEX "ChatRoom_creatorId_idx" ON "ChatRoom"("creatorId");

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
