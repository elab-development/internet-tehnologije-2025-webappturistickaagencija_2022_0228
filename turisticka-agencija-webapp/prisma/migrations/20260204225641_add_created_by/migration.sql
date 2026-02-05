/*
  Warnings:

  - Added the required column `createdById` to the `Arrangement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Arrangement" ADD COLUMN     "createdById" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Arrangement" ADD CONSTRAINT "Arrangement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
