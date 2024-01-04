import { container } from '@sapphire/framework';
import type { Snowflake } from 'discord.js';

export async function addWarn(
  userId: Snowflake,
  modId: Snowflake,
  message: string,
) {
  await container.database.warning.create({
    data: {
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
      mod: {
        connect: {
          id: modId,
        },
      },
      note: message,
    },
  });
}
