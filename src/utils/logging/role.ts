import { container } from '@sapphire/framework';
import type { Snowflake, Role } from 'discord.js';

export async function roleLog(
  userId: Snowflake,
  modId: Snowflake,
  role: Role,
  staffRole : boolean,
  add: boolean,
) {
  await container.database.roleLog.create({
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
        connectOrCreate: {
          where: {
            id: modId,
          },
          create: {
            id: modId,
          },
        },
      },
      role: {
        connectOrCreate: {
          where: {
            id: role.id,
          },
          create: {
            id: role.id,
            name: role.name,
            staff: staffRole,
          },
        },
      },
      add,
    },
  });
}

export async function roleAddLog(
  userId: Snowflake,
  modId: Snowflake,
  role: Role,
  staffRole = false,
) {
  await roleLog(userId, modId, role, staffRole, true);
}

export async function roleRemoveLog(
  userId: Snowflake,
  modId: Snowflake,
  role: Role,
  staffRole = false,
) {
  await roleLog(userId, modId, role, staffRole, false);
}
