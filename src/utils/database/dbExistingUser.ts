// SPDX-License-Identifier: GPL-3.0-or-later
/*
    Animal Rights Advocates Discord Bot
    Copyright (C) 2022  Anthony Berg

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import type {
  GuildMember,
  GuildMemberRoleManager,
  Snowflake,
} from 'discord.js';
import { container } from '@sapphire/framework';
import IDs from '#utils/ids';

/**
 * Checks if the user exists on the User table in the database
 * @param {string} userId Snowflake for the user being checked
 * @return {boolean} If the user was found
 */
export async function userExists(userId: Snowflake) {
  // Counts if the user is on the database by their snowflake
  const userQuery = await container.database.user.findFirst({
    where: {
      id: userId,
    },
    select: {
      id: true,
    },
  });

  // If the user is found on the database, then return true, otherwise, false.
  return userQuery !== null;
}

/**
 * Convert GuildMemberRoleManager to a dictionary of roles
 * @param roles The user's GuildMemberRoleManager
 * @return Dictionary of roles specific for the server
 */
function getRoles(roles: GuildMemberRoleManager) {
  // Checks what roles the user has
  const rolesDict = {
    vegan: roles.cache.has(IDs.roles.vegan.vegan),
    activist: roles.cache.has(IDs.roles.vegan.activist),
    plus: roles.cache.has(IDs.roles.vegan.plus),
    notVegan: roles.cache.has(IDs.roles.nonvegan.nonvegan),
    vegCurious: roles.cache.has(IDs.roles.nonvegan.vegCurious),
    convinced: roles.cache.has(IDs.roles.nonvegan.convinced),
    trusted: roles.cache.has(IDs.roles.trusted),
    muted: roles.cache.has(IDs.roles.restrictions.muted),
  };

  return rolesDict;
}

/**
 * Add user to the database, if they have not been added beforehand
 * @param {GuildMember} member GuildMember for the user to be added to the database
 */
export async function addExistingUser(member: GuildMember) {
  // Checks if user exists on the database
  if (await userExists(member.id)) {
    return;
  }

  // Parse all the roles into a dictionary
  const roles = getRoles(member.roles);

  // Create the user in the database
  await container.database.user.create({
    data: {
      id: member.id,
      vegan: roles.vegan,
      trusted: roles.trusted,
      activist: roles.activist,
      plus: roles.plus,
      notVegan: roles.notVegan,
      vegCurious: roles.vegCurious,
      convinced: roles.convinced,
      muted: roles.muted,
    },
  });
}

/**
 * Only add the snowflake of the user to the User database. This could be used for
 * cases where the user is not on the server, and they may have needed moderation
 * action done on them.
 * @param {string} userId Snowflake of the user to be added to the User table
 */
export async function addEmptyUser(userId: Snowflake) {
  // Checks if the user exists on the database
  if (await userExists(userId)) {
    return;
  }

  // Create the user in the database
  await container.database.user.create({
    data: {
      id: userId,
    },
  });
}

/**
 * Updates the roles of the user on the User table. This can also be used to create
 * a user onto the User table if they do not exist.
 * @param {GuildMember} member The user to be updated on the User table
 */
export async function updateUser(member: GuildMember) {
  // Parse all the roles into a dictionary
  const roles = getRoles(member.roles);

  await container.database.user.upsert({
    where: {
      id: member.id,
    },
    update: {
      vegan: roles.vegan,
      trusted: roles.trusted,
      activist: roles.activist,
      plus: roles.plus,
      notVegan: roles.notVegan,
      vegCurious: roles.vegCurious,
      convinced: roles.convinced,
      muted: roles.muted,
    },
    create: {
      id: member.id,
      vegan: roles.vegan,
      trusted: roles.trusted,
      activist: roles.activist,
      plus: roles.plus,
      notVegan: roles.notVegan,
      vegCurious: roles.vegCurious,
      convinced: roles.convinced,
      muted: roles.muted,
    },
  });
}

/**
 * Gets the roles that the user that is on the User table.
 * @param {string} userId Snowflake of the user to fetch roles from
 * @return {Snowflake[]} Array of Role Snowflakes
 */
export async function fetchRoles(userId: Snowflake) {
  // Get the user's roles
  const roleQuery = await container.database.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      vegan: true,
      trusted: true,
      activist: true,
      plus: true,
      notVegan: true,
      vegCurious: true,
      convinced: true,
    },
  });

  // Assign roles to role snowflakes
  const roles: Snowflake[] = [];

  if (roleQuery === null) {
    return roles;
  }
  if (roleQuery.vegan) {
    roles.push(IDs.roles.vegan.vegan);
    roles.push(IDs.roles.vegan.nvAccess);
  }
  if (roleQuery.trusted) {
    roles.push(IDs.roles.trusted);
  }
  if (roleQuery.activist) {
    roles.push(IDs.roles.vegan.activist);
  }
  if (roleQuery.plus) {
    roles.push(IDs.roles.vegan.plus);
  }
  if (roleQuery.notVegan) {
    roles.push(IDs.roles.nonvegan.nonvegan);
  }
  if (roleQuery.vegCurious) {
    roles.push(IDs.roles.nonvegan.vegCurious);
  }
  if (roleQuery.convinced) {
    roles.push(IDs.roles.nonvegan.convinced);
  }

  return roles;
}

/**
 * Log the roles that a user had when leaving the server onto the database.
 * @param {GuildMember} member The user who left the server
 */
export async function logLeaving(member: GuildMember) {
  const roles: Snowflake[] = [];
  member.roles.cache.forEach((role) => {
    if (role.id !== member.guild.id) {
      roles.push(role.id);
    }
  });

  await container.database.leaveLog.create({
    data: {
      user: {
        connect: {
          id: member.id,
        },
      },
      roles,
    },
  });
}

/**
 * Get the roles that the user had prior to when they left the server.
 * @param {string} userId Snowflake of the user who joined the server
 * @return {string[]} Array of Role Snowflakes
 */
export async function getLeaveRoles(userId: Snowflake) {
  const roles = container.database.leaveLog.findFirst({
    where: {
      userId,
    },
    orderBy: {
      id: 'desc',
    },
    select: {
      roles: true,
    },
  });

  return roles;
}
