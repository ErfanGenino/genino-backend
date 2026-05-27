/*
  Warnings:

  - A unique constraint covering the columns `[childId,requesterId,requestedRole]` on the table `ChildFollowRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ChildFollowRequest_childId_requesterId_key";

-- CreateIndex
CREATE UNIQUE INDEX "ChildFollowRequest_childId_requesterId_requestedRole_key" ON "ChildFollowRequest"("childId", "requesterId", "requestedRole");
