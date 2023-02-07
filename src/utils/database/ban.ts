import { container } from '@sapphire/framework';

export async function addBan(userId: string, modId: string, reason: string) {
  // Add the user to the database
  await container.database.ban.create({
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
}

export async function removeBan(userId: string, modId: string) {
  const ban = await container.database.ban.findFirst({
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
  await container.database.ban.update({
    where: {
      id: ban.id,
    },
    data: {
      endModId: modId,
      endTime: new Date(),
      active: false,
    },
  });
}

export async function checkActive(userId: string) {
  const ban = await container.database.ban.findFirst({
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
  const ban = await container.database.ban.findFirst({
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
