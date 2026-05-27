-- CreateTable
CREATE TABLE "MemoryAlbum" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "childId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemoryAlbum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryAlbumPhoto" (
    "id" SERIAL NOT NULL,
    "albumId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryAlbumPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemoryAlbum_userId_idx" ON "MemoryAlbum"("userId");

-- CreateIndex
CREATE INDEX "MemoryAlbum_childId_idx" ON "MemoryAlbum"("childId");

-- CreateIndex
CREATE INDEX "MemoryAlbum_userId_childId_idx" ON "MemoryAlbum"("userId", "childId");

-- CreateIndex
CREATE INDEX "MemoryAlbum_createdAt_idx" ON "MemoryAlbum"("createdAt");

-- CreateIndex
CREATE INDEX "MemoryAlbumPhoto_albumId_idx" ON "MemoryAlbumPhoto"("albumId");

-- CreateIndex
CREATE INDEX "MemoryAlbumPhoto_createdAt_idx" ON "MemoryAlbumPhoto"("createdAt");

-- AddForeignKey
ALTER TABLE "MemoryAlbum" ADD CONSTRAINT "MemoryAlbum_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryAlbum" ADD CONSTRAINT "MemoryAlbum_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryAlbumPhoto" ADD CONSTRAINT "MemoryAlbumPhoto_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "MemoryAlbum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
