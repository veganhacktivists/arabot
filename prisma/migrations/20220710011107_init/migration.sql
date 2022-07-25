-- CreateTable
CREATE TABLE "user" (
    "id" INTEGER NOT NULL,
    "vegan" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);
