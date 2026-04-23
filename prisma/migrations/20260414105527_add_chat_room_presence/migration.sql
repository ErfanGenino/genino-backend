-- CreateTable
CREATE TABLE "ChatRoomPresence" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatRoomPresence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatRoomPresence_roomId_idx" ON "ChatRoomPresence"("roomId");

-- CreateIndex
CREATE INDEX "ChatRoomPresence_userId_idx" ON "ChatRoomPresence"("userId");

-- CreateIndex
CREATE INDEX "ChatRoomPresence_lastSeenAt_idx" ON "ChatRoomPresence"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoomPresence_roomId_userId_key" ON "ChatRoomPresence"("roomId", "userId");

-- AddForeignKey
ALTER TABLE "ChatRoomPresence" ADD CONSTRAINT "ChatRoomPresence_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoomPresence" ADD CONSTRAINT "ChatRoomPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
