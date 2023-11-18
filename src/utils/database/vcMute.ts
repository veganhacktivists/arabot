import { container } from '@sapphire/framework';
import type { Snowflake } from 'discord.js';

export async function addMute(
  userId: Snowflake,
  modId: Snowflake,
  reason: string | null,
) {
  // Add the user to the database
  await container.database.vCMute.create({
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
    },
  });
}

export async function removeMute(userId: Snowflake) {
  const mute = await container.database.vCMute.findFirst({
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

  if (mute === null) {
    return;
  }

  // Query to deactivate the specific sus note
  await container.database.vCMute.update({
    where: {
      id: mute.id,
    },
    data: {
      endTime: new Date(),
    },
  });
}

export async function checkActive(userId: Snowflake) {
  const mute = await container.database.vCMute.findFirst({
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

  if (mute === null) {
    return false;
  }

  return mute.endTime === null;
}
