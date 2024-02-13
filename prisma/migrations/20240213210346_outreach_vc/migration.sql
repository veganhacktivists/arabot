/*
  Warnings:

  - Added the required column `channelId` to the `StatRole` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StatRole" ADD COLUMN     "channelId" TEXT NOT NULL;
