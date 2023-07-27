import { container } from '@sapphire/framework';

/**
 * Add an entry to the database to log a ban for a user
 * @param {string} userId Snowflake for the User to ban
 * @param {string} modId Snowflake for the Moderator who is banning the user
 * @param {string} reason Reason for banning the user
 */
export async function addBan(userId: string, modId: string, reason: string) {
  // Add the user to the database
  await container.database.ban.create({
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

/**
 * Deactivates the ban on the database for the user
 * @param {string} userId Snowflake for the User to unban
 * @param {string} modId Snowflake for the Moderator who is unbanning the user
 */
export async function removeBan(userId: string, modId: string) {
  const ban = await container.database.ban.findFirst({
    where: {
      userId,
    },
    orderBy: {
      id: 'desc',
    },
  });

  if (ban === null) {
    return;
  }

  // Query to deactivate the specific sus note
  await container.database.ban.update({
    where: {
      id: ban.id,
    },
    data: {
      endModId: modId,
      endTime: new Date(),
      active: false,
    },
  });
}

/**
 * Check if the user is banned on the database
 * @param userId Snowflake of the User to check the ban on
 * @return {boolean} If the ban is active on the database
 */
export async function checkBan(userId: string) {
  const ban = await container.database.ban.findFirst({
    where: {
      userId,
    },
    orderBy: {
      id: 'desc',
    },
  });

  if (ban === null) {
    return false;
  }

  return ban.active;
}

/**
 * Get the ban reason for a user from the database
 * @param {string} userId Snowflake for the User
 * @return {string} User's reason for being banned
 */
export async function getBanReason(userId: string) {
  const ban = await container.database.ban.findFirst({
    where: {
      userId,
    },
    orderBy: {
      id: 'desc',
    },
  });

  if (ban === null) {
    return '';
  }

  return ban.reason;
}
