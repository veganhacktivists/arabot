-- AlterTable
ALTER TABLE "Restrict" ADD COLUMN     "endModId" TEXT;

-- AddForeignKey
ALTER TABLE "Restrict" ADD CONSTRAINT "Restrict_endModId_fkey" FOREIGN KEY ("endModId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
