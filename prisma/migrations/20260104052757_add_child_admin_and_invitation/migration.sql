-- AlterTable
ALTER TABLE "User" ALTER COLUMN "lifeStage" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ChildAdmin" (
    "id" SERIAL NOT NULL,
    "childId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildInvitation" (
    "id" SERIAL NOT NULL,
    "childId" INTEGER NOT NULL,
    "inviterId" INTEGER,
    "email" TEXT,
    "phone" TEXT,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChildAdmin_childId_userId_key" ON "ChildAdmin"("childId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildInvitation_token_key" ON "ChildInvitation"("token");

-- CreateIndex
CREATE INDEX "ChildInvitation_childId_idx" ON "ChildInvitation"("childId");

-- CreateIndex
CREATE INDEX "ChildInvitation_inviterId_idx" ON "ChildInvitation"("inviterId");

-- CreateIndex
CREATE INDEX "ChildInvitation_email_idx" ON "ChildInvitation"("email");

-- CreateIndex
CREATE INDEX "ChildInvitation_phone_idx" ON "ChildInvitation"("phone");

-- AddForeignKey
ALTER TABLE "ChildAdmin" ADD CONSTRAINT "ChildAdmin_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildAdmin" ADD CONSTRAINT "ChildAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildInvitation" ADD CONSTRAINT "ChildInvitation_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildInvitation" ADD CONSTRAINT "ChildInvitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
