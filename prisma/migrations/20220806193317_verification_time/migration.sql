/*
  Warnings:

  - You are about to drop the column `time` on the `VerifyUnblock` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Verify" DROP COLUMN "time",
ADD COLUMN     "finishTime" TIMESTAMP(3),
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
