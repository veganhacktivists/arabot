import { container } from '@sapphire/framework';
import type { Snowflake } from 'discord.js';

// Balance

export async function getBalance(userId: Snowflake) {
  let balance = await container.database.balance.findUnique({
    where: {
      userId,
    },
    select: {
      balance: true,
    },
  });

  if (balance === null) {
    balance = await container.database.balance.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        balance: 0,
      },
    });
  }

  return balance;
}

// Daily

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
