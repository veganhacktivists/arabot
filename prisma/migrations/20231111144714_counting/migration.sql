-- CreateTable
CREATE TABLE "Counting" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,

    CONSTRAINT "Counting_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Counting" ADD CONSTRAINT "Counting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
