/*
  Warnings:

  - A unique constraint covering the columns `[userId,articleId]` on the table `SavedArticle` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SavedArticle_userId_articleId_key" ON "SavedArticle"("userId", "articleId");
