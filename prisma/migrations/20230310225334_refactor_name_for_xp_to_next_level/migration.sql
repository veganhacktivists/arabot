/*
  Warnings:

  - You are about to drop the column `xpToNextLevel` on the `Xp` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Xp" DROP COLUMN "xpToNextLevel",
ADD COLUMN     "xpForNextLevel" INTEGER NOT NULL DEFAULT 0;
