-- CreateTable
CREATE TABLE "ChildFollowRequest" (
    "id" SERIAL NOT NULL,
    "childId" INTEGER NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "requestedRole" TEXT NOT NULL,
    "approvedRole" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PARENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildFollowRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChildFollowRequest_childId_idx" ON "ChildFollowRequest"("childId");

-- CreateIndex
CREATE INDEX "ChildFollowRequest_requesterId_idx" ON "ChildFollowRequest"("requesterId");

-- CreateIndex
CREATE INDEX "ChildFollowRequest_status_idx" ON "ChildFollowRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ChildFollowRequest_childId_requesterId_key" ON "ChildFollowRequest"("childId", "requesterId");

-- AddForeignKey
ALTER TABLE "ChildFollowRequest" ADD CONSTRAINT "ChildFollowRequest_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildFollowRequest" ADD CONSTRAINT "ChildFollowRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
