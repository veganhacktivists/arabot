-- AlterTable
ALTER TABLE "TempBan" ADD COLUMN     "endModId" TEXT;

-- AddForeignKey
ALTER TABLE "TempBan" ADD CONSTRAINT "TempBan_endModId_fkey" FOREIGN KEY ("endModId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
