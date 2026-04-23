-- CreateTable
CREATE TABLE "FavoriteChatRoom" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FavoriteChatRoom_userId_idx" ON "FavoriteChatRoom"("userId");

-- CreateIndex
CREATE INDEX "FavoriteChatRoom_roomId_idx" ON "FavoriteChatRoom"("roomId");

-- CreateIndex
CREATE INDEX "FavoriteChatRoom_createdAt_idx" ON "FavoriteChatRoom"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteChatRoom_userId_roomId_key" ON "FavoriteChatRoom"("userId", "roomId");

-- AddForeignKey
ALTER TABLE "FavoriteChatRoom" ADD CONSTRAINT "FavoriteChatRoom_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteChatRoom" ADD CONSTRAINT "FavoriteChatRoom_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
