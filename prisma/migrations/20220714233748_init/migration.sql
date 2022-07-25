/*
  Warnings:

  - Added the required column `note` to the `Sus` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sus" ADD COLUMN     "note" TEXT NOT NULL;
