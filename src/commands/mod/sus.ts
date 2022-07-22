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

import { Command, RegisterBehavior } from '@sapphire/framework';
import { Message, MessageEmbed } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { addExistingUser, userExists } from '../../utils/dbExistingUser';

export class SusCommand extends Command {
  public constructor(context: Command.Context) {
    super(context, {
      name: 'sus',
      description: 'Notes about users that are sus',
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
      // Subcommand to add a sus note
        .addSubcommand((command) => command.setName('add')
          .setDescription('Add a sus note about a user')
          .addUserOption((option) => option.setName('user')
            .setDescription('User to add the note')
            .setRequired(true))
          .addStringOption((option) => option.setName('note')
            .setDescription('Note about the user')
            .setRequired(true)))
      // Subcommand to list sus notes
        .addSubcommand((command) => command.setName('view')
          .setDescription('View a sus note for a user')
          .addUserOption((option) => option.setName('user')
            .setDescription('User to add the note')
            .setRequired(true))),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    const subcommand = interaction.options.getSubcommand(true);

    // Checks what subcommand was run
    switch (subcommand) {
      case 'add': {
        return await this.addNote(interaction);
      }
      case 'view': {
        return await this.listNote(interaction);
      }
    }

    // If subcommand is invalid
    await interaction.reply({
      content: 'Invalid sub command!',
      ephemeral: true,
      fetchReply: true,
    });
  }

  // Subcommand to add sus note
  public async addNote(interaction: Command.ChatInputInteraction) {
    // Get the arguments
    const user = interaction.options.getUser('user')!;
    const mod = interaction.member!.user;
    const note = interaction.options.getString('note')!;

    // Add the data to the database

    // Check if the user exists on the database
    const userGuildMember = interaction.guild!.members.cache.get(user.id)!;
    if (!await userExists(userGuildMember)) {
      await addExistingUser(userGuildMember);
    }
    // Check if the mod exists on the database
    const modGuildMember = interaction.guild!.members.cache.get(mod.id)!;
    if (!await userExists(modGuildMember)) {
      await addExistingUser(modGuildMember);
    }
    // TODO check if user is on the database and if not, add them to the database
    await addToDatabase(user.id, mod.id, note);

    await interaction.reply({
      content: `${user}: note: ${note}`,
      ephemeral: true,
      fetchReply: true,
    });
  }

  public async listNote(interaction: Command.ChatInputInteraction) {
    const user = interaction.options.getUser('user')!;

    // Gets the sus notes from the database
    const notes = await findNote(user.id, true);
    // Gets the username of the mod
    const modId = notes[notes.length - 1].modId;
    const mod = interaction.guild!.members.cache.get(modId)!.user.username;

    // Creates the embed to display the sus note
    const noteEmbed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(`Sus notes for ${user.username}`)
      .setThumbnail(user.avatarURL()!)
      .addField(`Moderator: ${mod} Date: ${notes[notes.length - 1].time}`, notes[notes.length - 1].note);

    // Sends the notes to the user
    await interaction.reply({
      embeds: [noteEmbed],
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

// Get a list of sus notes from the user
async function findNote(userId: string, active: boolean) {
  // Initialise the database connection
  const prisma = new PrismaClient();

  // Query to get the specific user's sus notes
  const getNote = await prisma.sus.findMany({
    where: {
      userId,
      active,
    },
  });

  // Close the database connection
  await prisma.$disconnect();
  return getNote;
}
