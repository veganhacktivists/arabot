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

export async function fetchWarning(warningId: number) {
  const warning = await container.database.warning.findUnique({
    where: {
      id: warningId,
    },
  });

  return warning;
}

export async function fetchWarnings(userId: Snowflake) {
  const warnings = await container.database.warning.findMany({
    where: {
      userId,
    },
    orderBy: {
      id: 'asc',
    },
  });

  return warnings;
}

export async function deleteWarning(warningId: number) {
  await container.database.warning.delete({
    where: {
      id: warningId,
    },
  });
}
