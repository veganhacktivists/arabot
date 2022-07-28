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
import { MessageEmbed } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { addExistingUser, userExists } from '../../utils/dbExistingUser';

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

async function deactivateNote(noteId: number) {
  // Initialise the database connection
  const prisma = new PrismaClient();

  // Query to deactivate the specific sus note
  await prisma.sus.update({
    where: {
      id: noteId,
    },
    data: {
      active: false,
    },
  });

  // Close the database connection
  await prisma.$disconnect();
}

async function deactivateAllNotes(userId: string) {
  // Initialise the database connection
  const prisma = new PrismaClient();

  // Query to deactivate the specific user's sus notes
  await prisma.sus.updateMany({
    where: {
      userId: {
        contains: userId,
      },
    },
    data: {
      active: false,
    },
  });

  // Close the database connection
  await prisma.$disconnect();
}

// Main command
export class SusCommand extends Command {
  public constructor(context: Command.Context) {
    super(context, {
      name: 'sus',
      description: 'Notes about users that are sus',
      preconditions: [['VerifierOnly', 'ModOnly']],
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
            .setDescription('User to view the note of')
            .setRequired(true)))
        // Subcommand to remove a specific sus note
        .addSubcommand((command) => command.setName('remove')
          .setDescription('Remove a specific sus note')
          .addIntegerOption((option) => option.setName('id')
            .setDescription('Sus note ID')
            .setRequired(true)))
        // Subcommand to remove all sus notes
        .addSubcommand((command) => command.setName('purge')
          .setDescription('Remove all sus notes from a user')
          .addUserOption((option) => option.setName('user')
            .setDescription('User to remove the note from')
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
      case 'remove': {
        return await this.removeNote(interaction);
      }
      case 'removeAll': {
        return await this.removeAllNotes(interaction);
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
    let user = interaction.options.getUser('user');
    let note = interaction.options.getString('note');

    // Checks if all the variables are of the right type
    if (user === null || interaction.member === null || note === null) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Remove possibility of null from variables
    user = user!;
    const mod = interaction.member!.user;
    note = note!;

    // Add the data to the database

    // Check if the user exists on the database
    const currentGuild = interaction.guild;

    // Checks if currentGuild is not null
    if (currentGuild === null) {
      await interaction.reply({
        content: 'Error fetching guild!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    const userGuildMember = currentGuild!.members.cache.get(user.id)!;
    if (!await userExists(userGuildMember)) {
      await addExistingUser(userGuildMember);
    }
    // Check if the mod exists on the database
    const modGuildMember = currentGuild!.members.cache.get(mod.id)!;
    if (!await userExists(modGuildMember)) {
      await addExistingUser(modGuildMember);
    }
    await addToDatabase(user.id, mod.id, note);

    await interaction.reply({
      content: `${user} note: ${note}`,
      ephemeral: true,
      fetchReply: true,
    });
  }

  public async listNote(interaction: Command.ChatInputInteraction) {
    // Get the arguments
    let user = interaction.options.getUser('user');

    // Checks if all the variables are of the right type
    if (user === null) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Remove possibility of null from variables
    user = user!;

    // Gets the sus notes from the database
    const notes = await findNote(user.id, true);

    // Checks if there are no notes on the user
    if (notes.length === 0) {
      await interaction.reply({
        content: `${user} has no sus notes!`,
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Gets the username of the mod
    const { modId } = notes[notes.length - 1];

    // Checks if variable mod will not be null
    const currentGuild = interaction.guild;
    if (currentGuild === null) {
      await interaction.reply({
        content: 'Error fetching guild!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }
    const modGuildMember = currentGuild!.members.cache.get(modId);
    if (modGuildMember === null) {
      await interaction.reply({
        content: 'Error fetching person who ran the command!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    const mod = modGuildMember!.user.username;

    // Creates the embed to display the sus note
    const noteEmbed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(`Sus notes for ${user.username}`)
      .setThumbnail(user.avatarURL()!)
      // TODO add a way to display more than 1 sus note
      .addField(
        `Sus ID: ${notes[notes.length - 1].id} | Moderator: ${mod} Date: <t:${Math.floor(notes[notes.length - 1].time.getTime() / 1000)}>`,
        notes[notes.length - 1].note,
      );

    // Sends the notes to the user
    await interaction.reply({
      embeds: [noteEmbed],
      ephemeral: true,
      fetchReply: true,
    });
  }

  public async removeNote(interaction: Command.ChatInputInteraction) {
    // Get the arguments
    let noteId = interaction.options.getInteger('id');

    // Checks if all the variables are of the right type
    if (noteId === null) {
      await interaction.reply({
        content: 'Error fetching id from Discord!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Remove possibility of null from variables
    noteId = noteId!;

    // TODO fetch the note and get mod input if they want to remove that note

    // Remove the sus notes from the database
    await deactivateNote(noteId);
    await interaction.reply({
      content: `Sus note ID ${noteId} has been removed successfully`,
      ephemeral: true,
      fetchReply: true,
    });
  }

  public async removeAllNotes(interaction: Command.ChatInputInteraction) {
    // Get the arguments
    let user = interaction.options.getUser('user');

    // Checks if all the variables are of the right type
    if (user === null) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Remove possibility of null from variables
    user = user!;

    // Check if the user had sus notes before trying to remove them
    // Gets the sus notes from the database
    const notes = await findNote(user.id, true);

    // Checks if there are no notes on the user
    if (notes.length === 0) {
      await interaction.reply({
        content: `${user} had no notes!`,
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // TODO display all notes from user and get mod input if they want to remove all those notes

    // Remove the sus notes from the database
    await deactivateAllNotes(user.id);
    await interaction.reply({
      content: `Sus notes have been removed for ${user} successfully`,
      ephemeral: true,
      fetchReply: true,
    });
  }
}
