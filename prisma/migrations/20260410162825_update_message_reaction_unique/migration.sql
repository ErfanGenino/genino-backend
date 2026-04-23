/*
  Warnings:

  - A unique constraint covering the columns `[messageId,userId]` on the table `MessageReaction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "MessageReaction_messageId_userId_emoji_key";

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_messageId_userId_key" ON "MessageReaction"("messageId", "userId");
