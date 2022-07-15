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

import type { GuildMember } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { IDs } from './ids';

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

  // Checks what roles the user has
  const hasVegan = user.roles.cache.has(IDs.roles.vegan.vegan);
  const hasActivist = user.roles.cache.has(IDs.roles.vegan.activist);
  const hasPlus = user.roles.cache.has(IDs.roles.vegan.plus);
  const hasVegCurious = user.roles.cache.has(IDs.roles.nonvegan.vegCurious);
  const hasConvinced = user.roles.cache.has(IDs.roles.nonvegan.convinced);
  const hasTrusted = user.roles.cache.has(IDs.roles.trusted);
  const hasMuted = user.roles.cache.has(IDs.roles.restrictions.muted);

  // Create the user in the database
  await prisma.user.create({
    data: {
      id: user.id,
      vegan: hasVegan,
      trusted: hasTrusted,
      activist: hasActivist,
      plus: hasPlus,
      vegCurious: hasVegCurious,
      convinced: hasConvinced,
      muted: hasMuted,
    },
  });

  // Close the database connection
  await prisma.$disconnect();
}
