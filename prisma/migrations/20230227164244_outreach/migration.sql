-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "eventType" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventType" (
    "type" TEXT NOT NULL,

    CONSTRAINT "EventType_pkey" PRIMARY KEY ("type")
);

-- CreateTable
CREATE TABLE "Stat" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "leaderId" TEXT NOT NULL,
    "vegan" INTEGER NOT NULL DEFAULT 0,
    "considered" INTEGER NOT NULL DEFAULT 0,
    "antivegan" INTEGER NOT NULL DEFAULT 0,
    "thanked" INTEGER NOT NULL DEFAULT 0,
    "documentary" INTEGER NOT NULL DEFAULT 0,
    "educated" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Stat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantStat" (
    "statId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ParticipantStat_pkey" PRIMARY KEY ("statId","userId")
);

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_eventType_fkey" FOREIGN KEY ("eventType") REFERENCES "EventType"("type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stat" ADD CONSTRAINT "Stat_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stat" ADD CONSTRAINT "Stat_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantStat" ADD CONSTRAINT "ParticipantStat_statId_fkey" FOREIGN KEY ("statId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantStat" ADD CONSTRAINT "ParticipantStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
