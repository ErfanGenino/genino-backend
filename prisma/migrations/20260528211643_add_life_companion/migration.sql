-- CreateTable
CREATE TABLE "LifeCompanionInvite" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),

    CONSTRAINT "LifeCompanionInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifeCompanion" (
    "id" SERIAL NOT NULL,
    "user1Id" INTEGER NOT NULL,
    "user2Id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LifeCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LifeCompanionInvite_senderId_idx" ON "LifeCompanionInvite"("senderId");

-- CreateIndex
CREATE INDEX "LifeCompanionInvite_receiverId_idx" ON "LifeCompanionInvite"("receiverId");

-- CreateIndex
CREATE INDEX "LifeCompanionInvite_status_idx" ON "LifeCompanionInvite"("status");

-- CreateIndex
CREATE INDEX "LifeCompanionInvite_createdAt_idx" ON "LifeCompanionInvite"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LifeCompanionInvite_senderId_receiverId_status_key" ON "LifeCompanionInvite"("senderId", "receiverId", "status");

-- CreateIndex
CREATE INDEX "LifeCompanion_user1Id_idx" ON "LifeCompanion"("user1Id");

-- CreateIndex
CREATE INDEX "LifeCompanion_user2Id_idx" ON "LifeCompanion"("user2Id");

-- CreateIndex
CREATE UNIQUE INDEX "LifeCompanion_user1Id_user2Id_key" ON "LifeCompanion"("user1Id", "user2Id");

-- AddForeignKey
ALTER TABLE "LifeCompanionInvite" ADD CONSTRAINT "LifeCompanionInvite_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifeCompanionInvite" ADD CONSTRAINT "LifeCompanionInvite_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifeCompanion" ADD CONSTRAINT "LifeCompanion_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifeCompanion" ADD CONSTRAINT "LifeCompanion_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
