/*
  Warnings:

  - Added the required column `modId` to the `Ban` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modId` to the `Restrict` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modId` to the `TempBan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ban" ADD COLUMN     "modId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Restrict" ADD COLUMN     "modId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TempBan" ADD COLUMN     "modId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Verify" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "verifierId" TEXT,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timedOut" BOOLEAN NOT NULL DEFAULT false,
    "vegan" BOOLEAN NOT NULL DEFAULT false,
    "text" BOOLEAN NOT NULL DEFAULT false,
    "serverVegan" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "Verify_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sus" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "modId" TEXT NOT NULL,

    CONSTRAINT "Sus_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Verify" ADD CONSTRAINT "Verify_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verify" ADD CONSTRAINT "Verify_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sus" ADD CONSTRAINT "Sus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sus" ADD CONSTRAINT "Sus_modId_fkey" FOREIGN KEY ("modId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restrict" ADD CONSTRAINT "Restrict_modId_fkey" FOREIGN KEY ("modId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ban" ADD CONSTRAINT "Ban_modId_fkey" FOREIGN KEY ("modId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TempBan" ADD CONSTRAINT "TempBan_modId_fkey" FOREIGN KEY ("modId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
