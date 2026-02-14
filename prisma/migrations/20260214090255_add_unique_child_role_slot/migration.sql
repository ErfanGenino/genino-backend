/*
  Warnings:

  - A unique constraint covering the columns `[childId,role,slot]` on the table `ChildAdmin` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ChildAdmin_childId_role_slot_key" ON "ChildAdmin"("childId", "role", "slot");
