-- CreateTable
CREATE TABLE "Warnings" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "modId" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT NOT NULL,

    CONSTRAINT "Warnings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Warnings" ADD CONSTRAINT "Warnings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warnings" ADD CONSTRAINT "Warnings_modId_fkey" FOREIGN KEY ("modId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
