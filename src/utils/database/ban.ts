import { PrismaClient } from '@prisma/client';

export async function addBan(userId: string, modId: string, reason: string) {
  // Initialise the database connection
  const prisma = new PrismaClient();

  // Add the user to the database
  await prisma.ban.create({
    data: {
      user: {
        connect: {
          id: userId,
        },
      },
      mod: {
        connect: {
          id: modId,
        },
      },
      reason,
    },
  });

  // Close the database connection
  await prisma.$disconnect();
}

export async function removeBan(userId: string, modId: string) {
  // Initialise the database connection
  const prisma = new PrismaClient();

  const ban = await prisma.ban.findFirst({
    where: {
      userId,
    },
    orderBy: {
      id: 'desc',
    },
  });

  if (ban === null) {
    return;
  }

  // Query to deactivate the specific sus note
  await prisma.ban.update({
    where: {
      id: ban.id,
    },
    data: {
      endModId: modId,
      endTime: new Date(),
      active: false,
    },
  });

  // Close the database connection
  await prisma.$disconnect();
}

export async function checkActive(userId: string) {
  // Initialise the database connection
  const prisma = new PrismaClient();

  const ban = await prisma.ban.findFirst({
    where: {
      userId,
    },
    orderBy: {
      id: 'desc',
    },
  });

  if (ban === null) {
    return false;
  }

  return ban.active;
}

export async function getReason(userId: string) {
  // Initialise the database connection
  const prisma = new PrismaClient();

  const ban = await prisma.ban.findFirst({
    where: {
      userId,
    },
    orderBy: {
      id: 'desc',
    },
  });

  if (ban === null) {
    return '';
  }

  return ban.reason;
}
