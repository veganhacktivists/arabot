/*
  Warnings:

  - You are about to drop the column `endedTime` on the `Restrict` table. All the data in the column will be lost.
  - You are about to drop the column `endedTime` on the `TempBan` table. All the data in the column will be lost.
  - Added the required column `endTime` to the `TempBan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Restrict" DROP COLUMN "endedTime",
ADD COLUMN     "endTime" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TempBan" DROP COLUMN "endedTime",
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL;
