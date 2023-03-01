-- CreateTable
CREATE TABLE "StatRole" (
    "statId" INTEGER NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "StatRole_pkey" PRIMARY KEY ("statId")
);

-- AddForeignKey
ALTER TABLE "StatRole" ADD CONSTRAINT "StatRole_statId_fkey" FOREIGN KEY ("statId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
