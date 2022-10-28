/*
  Warnings:

  - Added the required column `endModId` to the `Ban` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ban" ADD COLUMN     "endModId" TEXT NOT NULL,
ADD COLUMN     "endTime" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Ban" ADD CONSTRAINT "Ban_endModId_fkey" FOREIGN KEY ("endModId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
