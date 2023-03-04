import { container } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import type { Snowflake } from 'discord.js';

function xpToNextLevel(level: number, xp: number) {
  return 5 * (level * level) + (50 * level) + 100 - xp;
}

export async function addXp(userId: Snowflake, xp: number) {
  const user = await container.database.xp.findUnique({
    where: {
      userId,
    },
    select: {
      xp: true,
      level: true,
    },
  });

  let level = 0;
  if (user !== null
    && xpToNextLevel(user.level, user.xp + xp) < 0) {
    level = 1;
  }

  await container.database.xp.upsert({
    where: {
      userId,
    },
    update: {
      xp: { increment: xp },
      level: { increment: level },
      messageCount: { increment: 1 },
      lastMessage: new Date(),
    },
    create: {
      user: {
        connectOrCreate: {
          where: {
            id: userId,
          },
          create: {
            id: userId,
          },
        },
      },
      messageCount: 1,
      xp,
    },
  });
}

export async function checkCanAddXp(userId: Snowflake) {
  const message = await container.database.xp.findUnique({
    where: {
      userId,
    },
    select: {
      lastMessage: true,
    },
  });

  if (message === null) {
    return true;
  }

  const cooldown = Time.Minute;

  return Date.now() - message.lastMessage.getTime() > cooldown;
}
