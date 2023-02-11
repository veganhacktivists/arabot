import { container } from '@sapphire/framework';
import type { Snowflake } from 'discord.js';

export async function restrict(userId: Snowflake, modId: Snowflake, reason: string) {
  // Add the user to the database
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

export async function unRestrict(userId: Snowflake, modId: Snowflake) {
  const restriction = await container.database.restrict.findFirst({
    where: {
      userId,
    },
    select: {
      id: true,
    },
    orderBy: {
      id: 'desc',
    },
  });

  if (restriction === null) {
    return;
  }

  // Query to deactivate the specific sus note
  await container.database.restrict.update({
    where: {
      id: restriction.id,
    },
    data: {
      endMod: {
        connect: {
          id: modId,
        },
      },
      endTime: new Date(),
    },
  });
}

export async function checkActive(userId: Snowflake) {
  const restriction = await container.database.restrict.findFirst({
    where: {
      userId,
    },
    select: {
      endTime: true,
    },
    orderBy: {
      id: 'desc',
    },
  });

  if (restriction === null) {
    return false;
  }

  return restriction.endTime === null;
}
