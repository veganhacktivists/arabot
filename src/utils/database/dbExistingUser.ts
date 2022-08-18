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

import type { GuildMember, GuildMemberRoleManager } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import IDs from '../ids';

// Checks if the user exists on the database
export async function userExists(user: GuildMember) {
  // Initialises Prisma Client
  const prisma = new PrismaClient();

  // Counts if the user is on the database by their snowflake
  const userExists = await prisma.user.count({
    where: {
      id: user.id,
    },
  });

  // Close the database connection
  await prisma.$disconnect();

  // If the user is found on the database, then return true, otherwise, false.
  if (userExists > 0) {
    return true;
  }
  return false;
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
export async function addExistingUser(user: GuildMember) {
  // Initialises Prisma Client
  const prisma = new PrismaClient();

  // Counts if the user is on the database by their snowflake
  const userExists = await prisma.user.count({
    where: {
      id: user.id,
    },
  });

  // If the user is already in the database
  if (userExists > 0) {
    return;
  }

  // Parse all the roles into a dictionary
  const roles = getRoles(user.roles);

  // Create the user in the database
  await prisma.user.create({
    data: {
      id: user.id,
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

  // Close the database connection
  await prisma.$disconnect();
}

export async function updateUser(user: GuildMember) {
  // Check if the user is already on the database
  if (!(await userExists(user))) {
    await addExistingUser(user);
    return;
  }

  // Parse all the roles into a dictionary
  const roles = getRoles(user.roles);

  // Initialises Prisma Client
  const prisma = new PrismaClient();

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      id: user.id,
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

  // Close the database connection
  await prisma.$disconnect();
}

export async function fetchRoles(user: string) {
  // Initialises Prisma Client
  const prisma = new PrismaClient();

  // Get the user's roles
  const roles = await prisma.user.findUnique({
    where: {
      id: user,
    },
    select: {
      trusted: true,
      plus: true,
      vegCurious: true,
    },
  });

  // Close the database connection
  await prisma.$disconnect();

  return roles;
}
