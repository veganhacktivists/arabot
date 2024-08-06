import { container } from '@sapphire/framework';
import type { Snowflake } from 'discord.js';

// Balance

export async function countTotal(
  senderId: Snowflake,
  type: string,
  receiverId: Snowflake | undefined = undefined,
) {
  const result = await container.database.funLog.count({
    where: {
      sendUserId: senderId,
      receiveUserId: receiverId,
      type: {
        name: type,
      },
    },
  });

  return result;
}

export async function addFunLog(
  senderId: Snowflake,
  type: string,
  receiverId: Snowflake | undefined = undefined,
) {
  if (receiverId === undefined) {
    await container.database.funLog.create({
      data: {
        sendUser: {
          connectOrCreate: {
            where: {
              id: senderId,
            },
            create: {
              id: senderId,
            },
          },
        },
        type: {
          connectOrCreate: {
            where: {
              name: type,
            },
            create: {
              name: type,
            },
          },
        },
      },
    });
    return;
  }

  await container.database.funLog.create({
    data: {
      sendUser: {
        connectOrCreate: {
          where: {
            id: senderId,
          },
          create: {
            id: senderId,
          },
        },
      },
      receiveUser: {
        connectOrCreate: {
          where: {
            id: receiverId,
          },
          create: {
            id: receiverId,
          },
        },
      },
      type: {
        connectOrCreate: {
          where: {
            name: type,
          },
          create: {
            name: type,
          },
        },
      },
    },
  });
}
