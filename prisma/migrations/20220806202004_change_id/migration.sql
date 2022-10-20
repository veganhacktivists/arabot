/*
  Warnings:

  - The primary key for the `VerifyUnblock` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `channelId` on the `VerifyUnblock` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Verify" DROP CONSTRAINT "Verify_pkey",
DROP COLUMN "channelId",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Verify_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Verify_id_seq";
