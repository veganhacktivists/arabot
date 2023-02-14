/*
  Warnings:

  - Added the required column `section` to the `Restrict` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Restrict" ADD COLUMN     "section" INTEGER NOT NULL;
