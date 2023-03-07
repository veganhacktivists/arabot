-- CreateTable
CREATE TABLE "FunLog" (
    "id" SERIAL NOT NULL,
    "sendUserId" TEXT NOT NULL,
    "receiveUserId" TEXT,
    "typeId" INTEGER NOT NULL,

    CONSTRAINT "FunLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FunType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FunType_name_key" ON "FunType"("name");

-- AddForeignKey
ALTER TABLE "FunLog" ADD CONSTRAINT "FunLog_sendUserId_fkey" FOREIGN KEY ("sendUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunLog" ADD CONSTRAINT "FunLog_receiveUserId_fkey" FOREIGN KEY ("receiveUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunLog" ADD CONSTRAINT "FunLog_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "FunType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
