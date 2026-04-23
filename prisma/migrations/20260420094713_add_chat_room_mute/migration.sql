-- CreateTable
CREATE TABLE "ChatRoomMute" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "mutedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatRoomMute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatRoomMute_roomId_idx" ON "ChatRoomMute"("roomId");

-- CreateIndex
CREATE INDEX "ChatRoomMute_userId_idx" ON "ChatRoomMute"("userId");

-- CreateIndex
CREATE INDEX "ChatRoomMute_mutedById_idx" ON "ChatRoomMute"("mutedById");

-- CreateIndex
CREATE INDEX "ChatRoomMute_createdAt_idx" ON "ChatRoomMute"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoomMute_roomId_userId_key" ON "ChatRoomMute"("roomId", "userId");

-- AddForeignKey
ALTER TABLE "ChatRoomMute" ADD CONSTRAINT "ChatRoomMute_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoomMute" ADD CONSTRAINT "ChatRoomMute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoomMute" ADD CONSTRAINT "ChatRoomMute_mutedById_fkey" FOREIGN KEY ("mutedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
