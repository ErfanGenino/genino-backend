/*
  Warnings:

  - You are about to drop the column `likes` on the `MemoryAlbum` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MemoryAlbum" DROP COLUMN "likes";

-- CreateTable
CREATE TABLE "MemoryAlbumLike" (
    "id" SERIAL NOT NULL,
    "albumId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryAlbumLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryAlbumComment" (
    "id" SERIAL NOT NULL,
    "albumId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryAlbumComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemoryAlbumLike_albumId_idx" ON "MemoryAlbumLike"("albumId");

-- CreateIndex
CREATE INDEX "MemoryAlbumLike_userId_idx" ON "MemoryAlbumLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MemoryAlbumLike_albumId_userId_key" ON "MemoryAlbumLike"("albumId", "userId");

-- CreateIndex
CREATE INDEX "MemoryAlbumComment_albumId_idx" ON "MemoryAlbumComment"("albumId");

-- CreateIndex
CREATE INDEX "MemoryAlbumComment_userId_idx" ON "MemoryAlbumComment"("userId");

-- CreateIndex
CREATE INDEX "MemoryAlbumComment_createdAt_idx" ON "MemoryAlbumComment"("createdAt");

-- AddForeignKey
ALTER TABLE "MemoryAlbumLike" ADD CONSTRAINT "MemoryAlbumLike_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "MemoryAlbum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryAlbumLike" ADD CONSTRAINT "MemoryAlbumLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryAlbumComment" ADD CONSTRAINT "MemoryAlbumComment_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "MemoryAlbum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryAlbumComment" ADD CONSTRAINT "MemoryAlbumComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
