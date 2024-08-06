import { container } from '@sapphire/framework';
import type { Snowflake } from 'discord.js';

export async function getLastCount() {
  const count = await container.database.counting.findFirst({
    orderBy: {
      id: 'desc',
    },
  });

  return count;
}

export async function addCount(userId: Snowflake, number: number) {
  await container.database.counting.create({
    data: {
      number,
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
    },
  });
}
