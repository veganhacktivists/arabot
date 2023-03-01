-- CreateTable
CREATE TABLE "LeaveLog" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roles" TEXT[],

    CONSTRAINT "LeaveLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LeaveLog" ADD CONSTRAINT "LeaveLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
