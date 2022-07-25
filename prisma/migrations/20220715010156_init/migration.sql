/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Ban" DROP CONSTRAINT "Ban_modId_fkey";

-- DropForeignKey
ALTER TABLE "Ban" DROP CONSTRAINT "Ban_userId_fkey";

-- DropForeignKey
ALTER TABLE "Restrict" DROP CONSTRAINT "Restrict_modId_fkey";

-- DropForeignKey
ALTER TABLE "Restrict" DROP CONSTRAINT "Restrict_userId_fkey";

-- DropForeignKey
ALTER TABLE "Sus" DROP CONSTRAINT "Sus_modId_fkey";

-- DropForeignKey
ALTER TABLE "Sus" DROP CONSTRAINT "Sus_userId_fkey";

-- DropForeignKey
ALTER TABLE "TempBan" DROP CONSTRAINT "TempBan_modId_fkey";

-- DropForeignKey
ALTER TABLE "TempBan" DROP CONSTRAINT "TempBan_userId_fkey";

-- DropForeignKey
ALTER TABLE "Verify" DROP CONSTRAINT "Verify_userId_fkey";

-- DropForeignKey
ALTER TABLE "Verify" DROP CONSTRAINT "Verify_verifierId_fkey";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Users" (
    "id" VARCHAR(255) NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lastDaily" TIMESTAMP(3),
    "vegan" BOOLEAN NOT NULL DEFAULT false,
    "trusted" BOOLEAN NOT NULL DEFAULT false,
    "activist" BOOLEAN NOT NULL DEFAULT false,
    "plus" BOOLEAN NOT NULL DEFAULT false,
    "vegCurious" BOOLEAN NOT NULL DEFAULT false,
    "convinced" BOOLEAN NOT NULL DEFAULT false,
    "muted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Verify" ADD CONSTRAINT "Verify_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verify" ADD CONSTRAINT "Verify_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sus" ADD CONSTRAINT "Sus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sus" ADD CONSTRAINT "Sus_modId_fkey" FOREIGN KEY ("modId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restrict" ADD CONSTRAINT "Restrict_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restrict" ADD CONSTRAINT "Restrict_modId_fkey" FOREIGN KEY ("modId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ban" ADD CONSTRAINT "Ban_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ban" ADD CONSTRAINT "Ban_modId_fkey" FOREIGN KEY ("modId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TempBan" ADD CONSTRAINT "TempBan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TempBan" ADD CONSTRAINT "TempBan_modId_fkey" FOREIGN KEY ("modId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
