import { container } from '@sapphire/framework';
import type { Snowflake } from 'discord.js';

export async function daily(userId: Snowflake, amount: number) {
  const balance = await container.database.user.update({
    where: {
      id: userId,
    },
    data: {
      Balance: {
        upsert: {
          update: {
            balance: { increment: amount },
          },
          create: {
            balance: amount,
          },
        },
      },
      Daily: {
        create: {
          amount,
        },
      },
    },
    include: {
      Balance: true,
    },
  });

  return balance;
}

export async function getLastDaily(userId: Snowflake) {
  const time = await container.database.daily.findFirst({
    where: {
      userId,
    },
    orderBy: {
      id: 'desc',
    },
    select: {
      time: true,
    },
  });

  return time;
}
