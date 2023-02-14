import { container } from '@sapphire/framework';
import type { Snowflake } from 'discord.js';

export async function restrict(
  userId: Snowflake,
  modId: Snowflake,
  reason: string,
  section: number,
) {
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
      section,
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

export async function getSection(userId: Snowflake) {
  const restriction = await container.database.restrict.findFirst({
    where: {
      userId,
    },
    select: {
      section: true,
    },
    orderBy: {
      id: 'desc',
    },
  });

  if (restriction === null) {
    return 0;
  }

  return restriction.section;
}

// This is only for restrictions created with the old bot
export async function unRestrictLegacy(userId: Snowflake, modId: Snowflake, section: number) {
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
      endMod: {
        connect: {
          id: modId,
        },
      },
      reason: 'This user was restricted with the old bot. Restrict reason, time and mod unknown, check old bot logs.',
      section,
    },
  });
}
