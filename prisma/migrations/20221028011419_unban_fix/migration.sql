-- DropForeignKey
ALTER TABLE "Ban" DROP CONSTRAINT "Ban_endModId_fkey";

-- AlterTable
ALTER TABLE "Ban" ALTER COLUMN "endModId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Ban" ADD CONSTRAINT "Ban_endModId_fkey" FOREIGN KEY ("endModId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
