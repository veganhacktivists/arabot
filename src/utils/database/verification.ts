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
import { updateUser } from './dbExistingUser';

export async function joinVerification(channelId: string, user: GuildMember) {
  // Update the user on the database with the current roles they have
  await updateUser(user);

  // Initialises Prisma Client
  const prisma = new PrismaClient();

  await prisma.verify.create({
    data: {
      id: channelId,
      user: {
        connect: {
          id: user.id,
        },
      },
    },
  });

  // Close database connection
  await prisma.$disconnect();
}

export async function startVerification(channelId: string) {
  // Initialises Prisma Client
  const prisma = new PrismaClient();

  await prisma.verify.update({
    where: {
      id: channelId,
    },
    data: {
      startTime: new Date(),
    },
  });

  // Close database connection
  await prisma.$disconnect();
}

export async function getUser(channelId: string) {
  // Initialises Prisma Client
  const prisma = new PrismaClient();

  // Get the snowflake of the user verifying
  const user = await prisma.verify.findUnique({
    where: {
      id: channelId,
    },
    select: {
      userId: true,
    },
  });

  // Close database connection
  await prisma.$disconnect();

  // Check the user could be found
  if (user === null) {
    return null;
  }

  // Return the user's snowflake
  return user.userId;
}

export async function finishVerification(
  channelId: string,
  info: {
    page: number,
    find: {
      reason: number,
      where: number
    },
    length: number,
    reasoning: number,
    life: number,
    food: number,
    roles: {
      vegan: boolean,
      activist: boolean,
      trusted: boolean,
      vegCurious: boolean,
      convinced: boolean
    } },
) {
  // Initialises Prisma Client
  const prisma = new PrismaClient();

  // TODO potentially add an incomplete tracker?
  await prisma.verify.update({
    where: {
      id: channelId,
    },
    data: {
      finishTime: new Date(),
      // Roles
      vegan: info.roles.vegan,
      activist: info.roles.activist,
      trusted: info.roles.trusted,
      vegCurious: info.roles.vegCurious,
      convinced: info.roles.convinced,
      // Statistics
      reason: info.find.reason,
      where: info.find.where,
      length: info.length,
      reasoning: info.reasoning,
      life: info.life,
      food: info.food,
    },
  });

  // Close database connection
  await prisma.$disconnect();
}
