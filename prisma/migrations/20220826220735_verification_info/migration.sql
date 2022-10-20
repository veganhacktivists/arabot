-- AlterTable
ALTER TABLE "Verify" ADD COLUMN     "activist" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "food" INTEGER,
ADD COLUMN     "length" INTEGER,
ADD COLUMN     "life" INTEGER,
ADD COLUMN     "reason" INTEGER,
ADD COLUMN     "reasoning" INTEGER,
ADD COLUMN     "trusted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vegCurious" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "where" INTEGER;
