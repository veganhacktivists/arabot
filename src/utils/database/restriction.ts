import { container } from '@sapphire/framework';

export async function addRestriction(userId: string, modId: string, reason: string) {
  await container.database.restrict.create({
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

export async function removeRestriction(userId: string, modId: string) {
  const restrict = await container.database.restrict.findFirst({
    where: {
      userId,
    },
    orderBy: {
      id: 'desc',
    },
  });

  if (restrict === null) {
    return;
  }

  // Query to deactivate the specific sus note
  await container.database.restrict.update({
    where: {
      id: restrict.id,
    },
    data: {
      endModId: modId,
      endTime: new Date(),
    },
  });
}

export async function checkActive(userId: string) {
  const restrict = await container.database.ban.findFirst({
    where: {
      userId,
    },
    orderBy: {
      id: 'desc',
    },
  });

  if (restrict === null) {
    return false;
  }

  return restrict.active;
}

export async function getReason(userId: string) {
  const restrict = await container.database.restrict.findFirst({
    where: {
      userId,
    },
    orderBy: {
      id: 'desc',
    },
  });

  if (restrict === null) {
    return '';
  }

  return restrict.reason;
}
