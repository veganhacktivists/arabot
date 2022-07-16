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

import { Command } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { addExistingUser, userExists } from '../../utils/dbExistingUser';
import { PrismaClient } from '@prisma/client';

export class SusCommand extends Command {
  public constructor(context: Command.Context) {
    super(context, {
      name: 'sus',
      description: 'Adds a sus note about a user.',
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) => builder
      .setName(this.name)
      .setDescription(this.description)
      .addUserOption((option) =>
        option.setName('user')
          .setDescription('User to add the note')
          .setRequired(true))
      .addStringOption((option) =>
        option.setName('note')
          .setDescription('Note about the user')
          .setRequired(true)));
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    // Get the arguments
    const user = interaction.options.getUser('user')!;
    const mod = interaction.member!.user;
    const note = interaction.options.getString('note')!;

    // Add the data to the database
    // TODO check if user is on the database and if not, add them to the database
    await addToDatabase(user.id, mod.id, note);

    await interaction.reply({
      content: `${user}: note: ${note}`,
      ephemeral: true,
      fetchReply: true,
    });
  }
  public async messageRun(message: Message) {
    const msg = await message.channel.send('Ping?');

    const content = `Pong from JavaScript! Bot Latency ${Math.round(this.container.client.ws.ping)}ms. API Latency ${msg.createdTimestamp - message.createdTimestamp}ms.`;

    // Checks if the user exists
    if (message.member === null) {
      await message.channel.send('Member not found');
      return;
    }

    // Checks if the user is on the database
    if (!await userExists(message.member)) {
      // If they are not on the database, add them to the database
      await addExistingUser(message.member);
    }

    await addToDatabase(message.member.id, message.member.id, 'This is a note :D');

    return msg.edit(content);
  }
}

async function addToDatabase(userId: string, modId: string, message: string) {
  // Initialise the database connection
  const prisma = new PrismaClient();

  // Add the user to the database
  await prisma.sus.create({
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
      note: message,
    },
  });

  // Close the database connection
  await prisma.$disconnect();
}
