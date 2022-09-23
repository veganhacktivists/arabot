/*
  Warnings:

  - Added the required column `channelId` to the `VerifyUnblock` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Verify" ADD COLUMN     "channelId" TEXT NOT NULL;
