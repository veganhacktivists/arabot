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

export async function joinVerification(user: GuildMember, channelId: string) {
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

export async function startVerification(verifier: GuildMember, channelId: string) {
  // Initialises Prisma Client
  const prisma = new PrismaClient();

  await prisma.verify.update({
    where: {
      id: channelId,
    },
    data: {
      verifier: {
        connect: {
          id: verifier.id,
        },
      },
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
  timedOut: boolean,
  vegan: boolean,
  text:boolean,
  serverVegan: boolean,
) {
  // Initialises Prisma Client
  const prisma = new PrismaClient();

  /*
  const user = await prisma.verify.findUnique({
    where: {
      id: channelId,
    },
    select: {
      userId: true,
    },
  });
   */

  // TODO potentially add an incomplete tracker?
  await prisma.verify.update({
    where: {
      id: channelId,
    },
    data: {
      timedOut,
      vegan,
      text,
      serverVegan,
    },
  });

  // Close database connection
  await prisma.$disconnect();

  // TODO add a way to give roles back after adding the new verification
  /*
  const roles = await fetchRoles(user!.userId);

  if (roles === null) {
    return;
  }

  // Give roles to the user
  const giveRoles = [];
  if (roles.trusted) {
    giveRoles.push(IDs.roles.trusted);
  }
  if (roles.plus) {
    giveRoles.push(IDs.roles.vegan.plus);
  }
  if (roles.vegCurious) {
    giveRoles.push(IDs.roles.nonvegan.vegCurious);
  }

  await user.roles.add(giveRoles);
  */
}
