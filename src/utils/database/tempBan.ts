import { container } from '@sapphire/framework';
import type { Snowflake } from 'discord.js';

export async function addTempBan(
  userId: Snowflake,
  modId: Snowflake,
  endTime: Date,
  reason: string,
) {
  // Add the user to the database
  await container.database.tempBan.create({
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
      endTime,
      reason,
    },
  });
}

export async function removeTempBan(userId: Snowflake, modId?: Snowflake) {
  const ban = await container.database.tempBan.findFirst({
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

  if (modId !== undefined) {
    await container.database.tempBan.update({
      where: {
        id: ban.id,
      },
      data: {
        endModId: modId,
        active: false,
      },
    });
    return;
  }

  await container.database.tempBan.update({
    where: {
      id: ban.id,
    },
    data: {
      active: false,
    },
  });
}

export async function checkTempBan(userId: Snowflake) {
  const ban = await container.database.tempBan.findFirst({
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

export async function getTempBanReason(userId: Snowflake) {
  const ban = await container.database.tempBan.findFirst({
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
