-- CreateTable
CREATE TABLE "ChatRoom" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatRoomMessage" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "text" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text',
    "fileUrl" TEXT,
    "replyToMessageId" INTEGER,
    "forwardedFromMessageId" INTEGER,
    "deletedForEveryoneAt" TIMESTAMP(3),
    "deletedBySenderAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatRoomMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatRoomMessageReaction" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatRoomMessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatRoom_isActive_idx" ON "ChatRoom"("isActive");

-- CreateIndex
CREATE INDEX "ChatRoom_updatedAt_idx" ON "ChatRoom"("updatedAt");

-- CreateIndex
CREATE INDEX "ChatRoomMessage_roomId_idx" ON "ChatRoomMessage"("roomId");

-- CreateIndex
CREATE INDEX "ChatRoomMessage_senderId_idx" ON "ChatRoomMessage"("senderId");

-- CreateIndex
CREATE INDEX "ChatRoomMessage_createdAt_idx" ON "ChatRoomMessage"("createdAt");

-- CreateIndex
CREATE INDEX "ChatRoomMessage_replyToMessageId_idx" ON "ChatRoomMessage"("replyToMessageId");

-- CreateIndex
CREATE INDEX "ChatRoomMessage_forwardedFromMessageId_idx" ON "ChatRoomMessage"("forwardedFromMessageId");

-- CreateIndex
CREATE INDEX "ChatRoomMessageReaction_messageId_idx" ON "ChatRoomMessageReaction"("messageId");

-- CreateIndex
CREATE INDEX "ChatRoomMessageReaction_userId_idx" ON "ChatRoomMessageReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoomMessageReaction_messageId_userId_key" ON "ChatRoomMessageReaction"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "ChatRoomMessage" ADD CONSTRAINT "ChatRoomMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoomMessage" ADD CONSTRAINT "ChatRoomMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoomMessage" ADD CONSTRAINT "ChatRoomMessage_replyToMessageId_fkey" FOREIGN KEY ("replyToMessageId") REFERENCES "ChatRoomMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoomMessage" ADD CONSTRAINT "ChatRoomMessage_forwardedFromMessageId_fkey" FOREIGN KEY ("forwardedFromMessageId") REFERENCES "ChatRoomMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoomMessageReaction" ADD CONSTRAINT "ChatRoomMessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatRoomMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoomMessageReaction" ADD CONSTRAINT "ChatRoomMessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
