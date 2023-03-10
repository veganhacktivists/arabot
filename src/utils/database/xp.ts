import { container } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import type { Snowflake } from 'discord.js';

function xpToNextLevel(level: number, xp: number) {
  return 5 * (level * level) + (50 * level) + 100 - xp;
}

export async function getUser(userId: Snowflake) {
  const user = await container.database.xp.findUnique({
    where: {
      userId,
    },
    select: {
      xp: true,
      xpToNextLevel: true,
      level: true,
    },
  });
  return user;
}

export async function addXp(userId: Snowflake, xp: number) {
  const user = await getUser(userId);
  let xpNextLevel = xp;

  let level = 0;
  if (user !== null) {
    xpNextLevel = xpToNextLevel(user.level, user.xpToNextLevel + xp);
    if (xpNextLevel < 0) {
      xpNextLevel = -xpNextLevel;
      level = 1;
    } else {
      xpNextLevel = user.xpToNextLevel + xp;
    }
  }

  await container.database.xp.upsert({
    where: {
      userId,
    },
    update: {
      xp: { increment: xp },
      xpToNextLevel: xpNextLevel,
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
      xpToNextLevel: xp,
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

export async function getRank(userId: Snowflake) {
  const user = await getUser(userId);

  const info = {
    rank: 0,
    level: 0,
    xp: 0,
  };

  if (user === null) {
    return info;
  }

  info.rank = await container.database.xp.count({
    where: {
      xp: {
        gte: user.xp,
      },
    },
    orderBy: {
      xp: 'desc',
    },
  });

  info.level = user.level;
  info.xp = user.xp;

  return info;
}
