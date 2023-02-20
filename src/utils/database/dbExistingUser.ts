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

import type { GuildMember, GuildMemberRoleManager, Snowflake } from 'discord.js';
import { container } from '@sapphire/framework';
import IDs from '#utils/ids';

// Checks if the user exists on the database
export async function userExists(userId: Snowflake) {
  // Counts if the user is on the database by their snowflake
  const userQuery = await container.database.user.count({
    where: {
      id: userId,
    },
  });

  // If the user is found on the database, then return true, otherwise, false.
  return userQuery > 0;
}

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

// Adds the user to the database if they were already on the server before the bot/database
export async function addExistingUser(member: GuildMember) {
  // Counts if the user is on the database by their snowflake
  const userQuery = await container.database.user.count({
    where: {
      id: member.id,
    },
  });

  // If the user is already in the database
  if (userQuery > 0) {
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

// Add an empty user to database in case they are not on the server
export async function addEmptyUser(userId: Snowflake) {
  // Counts if the user is on the database by their snowflake
  const userQuery = await container.database.user.count({
    where: {
      id: userId,
    },
  });

  // If the user is already in the database
  if (userQuery > 0) {
    return;
  }

  // Create the user in the database
  await container.database.user.create({
    data: {
      id: userId,
    },
  });
}

export async function updateUser(member: GuildMember) {
  // Check if the user is already on the database
  if (!(await userExists(member.id))) {
    await addExistingUser(member);
    return;
  }

  // Parse all the roles into a dictionary
  const roles = getRoles(member.roles);

  await container.database.user.update({
    where: {
      id: member.id,
    },
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
