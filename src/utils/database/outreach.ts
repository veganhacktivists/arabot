import { container } from '@sapphire/framework';
import type { Snowflake } from 'discord.js';

export async function createEvent(
  modId: Snowflake,
) {
  // Add the user to the database
  await container.database.event.create({
    data: {
      leader: {
        connect: {
          id: modId,
        },
      },
      type: {
        connect: {
          type: 'Discord Outreach',
        },
      },
    },
  });
}

export async function countTypes() {
  const count = await container.database.eventType.count();
  return count;
}

export async function createTypes() {
  await container.database.eventType.create({
    data: {
      type: 'Discord Outreach',
    },
  });
}

export async function setupTypes() {
  const types = [
    'Discord Outreach',
  ];

  if (types.length === await countTypes()) {
    return;
  }

  await createTypes();
}
