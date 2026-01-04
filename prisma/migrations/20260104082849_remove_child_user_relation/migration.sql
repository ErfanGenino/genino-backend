/*
  Warnings:

  - You are about to drop the column `userId` on the `Child` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Child" DROP CONSTRAINT "Child_userId_fkey";

-- AlterTable
ALTER TABLE "Child" DROP COLUMN "userId";
