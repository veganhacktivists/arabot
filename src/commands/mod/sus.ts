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
import {
  MessageEmbed, MessageActionRow, MessageButton, Constants, ButtonInteraction,
} from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { isMessageInstance } from '@sapphire/discord.js-utilities';
import { addExistingUser, userExists } from '../../utils/database/dbExistingUser';
import IDs from '../../utils/ids';

// TODO add a check when they join the server to give the user the sus role again

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
async function findNotes(userId: string, active: boolean) {
  // Initialise the database connection
  const prisma = new PrismaClient();

  // Query to get the specific user's sus notes
  const note = await prisma.sus.findMany({
    where: {
      userId,
      active,
    },
  });

  // Close the database connection
  await prisma.$disconnect();
  return note;
}

// Get one note from the id
async function getNote(noteId: number) {
  // Initialise the database connection
  const prisma = new PrismaClient();

  // Query to get the specific user's sus notes
  const note = await prisma.sus.findUnique({
    where: {
      id: noteId,
    },
  });

  // Close the database connection
  await prisma.$disconnect();
  return note;
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
class SusCommand extends Command {
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
        await this.addNote(interaction);
        return;
      }
      case 'view': {
        await this.listNote(interaction);
        return;
      }
      case 'remove': {
        await this.removeNote(interaction);
        return;
      }
      case 'purge': {
        await this.removeAllNotes(interaction);
        return;
      }
      default: {
        // If subcommand is invalid
        await interaction.reply({
          content: 'Invalid sub command!',
          ephemeral: true,
          fetchReply: true,
        });
      }
    }
  }

  // Subcommand to add sus note
  private async addNote(interaction: Command.ChatInputInteraction) {
    // Get the arguments
    let user = interaction.options.getUser('user');
    let note = interaction.options.getString('note');
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (user === null || interaction.member === null || note === null || guild === null) {
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
    const userGuildMember = guild!.members.cache.get(user.id);
    const modGuildMember = guild!.members.cache.get(mod.id);
    // TODO potentially add a method to add user by Snowflake
    if (userGuildMember === undefined || modGuildMember === undefined) {
      await interaction.reply({
        content: 'Error fetching users!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Check if user and mod are on the database
    if (!await userExists(userGuildMember!)) {
      await addExistingUser(userGuildMember!);
    }
    if (!await userExists(modGuildMember!)) {
      await addExistingUser(modGuildMember!);
    }
    await addToDatabase(user.id, mod.id, note);

    // Give the user the sus role they don't already have the sus note
    if (!userGuildMember.roles.cache.has(IDs.roles.restrictions.sus)) {
      await userGuildMember!.roles.add(IDs.roles.restrictions.sus);
    }

    await interaction.reply({
      content: `${user} note: ${note}`,
      ephemeral: true,
      fetchReply: true,
    });
  }

  private async listNote(interaction: Command.ChatInputInteraction) {
    // Get the arguments
    let user = interaction.options.getUser('user');
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (user === null || guild == null) {
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
    const notes = await findNotes(user.id, true);

    // Checks if there are no notes on the user
    if (notes.length === 0) {
      await interaction.reply({
        content: `${user} has no sus notes!`,
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Creates the embed to display the sus note
    const noteEmbed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(`${notes.length} sus notes for ${user.username}`)
      .setThumbnail(user.avatarURL()!);

    // Add up to 10 of the latest sus notes to the embed
    for (let i = notes.length > 10 ? notes.length - 10 : 0; i < notes.length; i += 1) {
      // Get mod name
      const modGuildMember = guild!.members.cache.get(notes[i].modId);
      let mod = notes[i].modId;
      if (modGuildMember !== undefined) {
        mod = modGuildMember!.displayName;
      }
      // Add sus note to embed
      noteEmbed.addField(
        `Sus ID: ${notes[i].id} | Moderator: ${mod} | Date: <t:${Math.floor(notes[i].time.getTime() / 1000)}>`,
        notes[i].note,
      );
    }

    // Sends the notes to the user
    await interaction.reply({
      embeds: [noteEmbed],
      ephemeral: true,
      fetchReply: true,
    });
  }

  private async removeNote(interaction: Command.ChatInputInteraction) {
    // Get the arguments
    let noteId = interaction.options.getInteger('id');
    const { guild, channel } = interaction;

    // Checks if all the variables are of the right type
    if (noteId === null || guild === null || channel === null || interaction.member === null) {
      await interaction.reply({
        content: 'Error fetching id from Discord!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Remove possibility of null from variables
    noteId = noteId!;

    // Get the note to be deleted
    const note = await getNote(noteId);

    // Checks if managed to fetch the note
    if (note === null) {
      await interaction.reply({
        content: 'Error fetching note from database!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Get user GuildMembers for user and mod and person who ran command
    const user = await guild!.members.cache.get(note!.userId);
    const mod = await guild!.members.cache.get(note!.modId);

    // Get user's name
    let userName = note!.userId;
    if (user !== undefined) {
      userName = user!.displayName;
    }

    // Get mod name
    let modName = note!.modId;
    if (mod !== undefined) {
      modName = mod!.displayName;
    }

    // Create an embed for the note
    const noteEmbed = new MessageEmbed()
      .setColor('#ff0000')
      .setTitle(`Sus note for ${userName}`)
      .setThumbnail(user!.avatarURL()!) // TODO avatar does not show when run
      .addField(
        `ID: ${noteId} | Moderator: ${modName} | Date: <t:${Math.floor(note!.time.getTime() / 1000)}>`,
        note!.note,
      );

    // Create buttons to delete or cancel the deletion
    const buttons = new MessageActionRow<MessageButton>()
      .addComponents(
        new MessageButton()
          .setCustomId(`delete${noteId}`)
          .setLabel('Delete')
          .setStyle(Constants.MessageButtonStyles.DANGER),
        new MessageButton()
          .setCustomId(`cancel${noteId}`)
          .setLabel('Cancel')
          .setStyle(Constants.MessageButtonStyles.SECONDARY),
      );

    // Sends the note to verify this note is to be deleted
    const message = await interaction.reply({
      embeds: [noteEmbed],
      components: [buttons],
      ephemeral: true,
      fetchReply: true,
    });

    // Checks if the message is not an APIMessage
    if (!isMessageInstance(message)) {
      await interaction.editReply('Failed to retrieve the message :(');
      return;
    }

    // Listen for the button presses
    const collector = channel!.createMessageComponentCollector({
      max: 1, // Maximum of 1 button press
      time: 15000, // 15 seconds
    });

    // Button pressed
    collector.on('collect', async (button: ButtonInteraction) => {
      if (button.customId === `delete${noteId}`) {
        await deactivateNote(noteId!);
        await interaction.editReply({
          content: `${user!}'s sus note (ID: ${noteId}) has been successfully removed`,
          embeds: [],
        });

        // TODO create a new Prisma function to only count and not to get a whole list of sus notes
        // Check how many notes the user has and if 0, then remove sus note
        const notes = await findNotes(user!.id, true);

        // Checks if there are no notes on the user and if there's none, remove the sus role
        if (notes.length === 0) {
          await user!.roles.remove(IDs.roles.restrictions.sus);
        }
      }
    });

    // Remove the buttons after they have been clicked
    collector.on('end', async () => {
      await interaction.editReply({
        components: [],
      });
    });
  }

  private async removeAllNotes(interaction: Command.ChatInputInteraction) {
    // Get the arguments
    const user = interaction.options.getUser('user');
    const { guild, channel } = interaction;

    // Checks if all the variables are of the right type
    if (user === null || guild === null || channel === null) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    const userGuildMember = guild!.members.cache.get(user!.id);

    // Checks if managed to find GuildMember for the user
    if (userGuildMember === undefined) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Check if the user had sus notes before trying to remove them
    // Gets the sus notes from the database
    const notes = await findNotes(user!.id, true);

    // Checks if there are no notes on the user
    if (notes.length === 0) {
      await interaction.reply({
        content: `${user!} had no notes!`,
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Creates the embed to display the sus note
    const noteEmbed = new MessageEmbed()
      .setColor('#ff0000')
      .setTitle(`Delete ${notes.length} sus notes for ${user!.username}?`)
      .setThumbnail(user!.avatarURL()!);

    // Add up to 10 of the latest sus notes to the embed
    for (let i = notes.length > 10 ? notes.length - 10 : 0; i < notes.length; i += 1) {
      // Get mod name
      const modGuildMember = guild!.members.cache.get(notes[i].modId);
      let mod = notes[i].modId;
      if (modGuildMember !== undefined) {
        mod = modGuildMember!.displayName;
      }
      // Add sus note to embed
      noteEmbed.addField(
        `Sus ID: ${notes[i].id} | Moderator: ${mod} | Date: <t:${Math.floor(notes[i].time.getTime() / 1000)}>`,
        notes[i].note,
      );
    }

    // Create buttons to delete or cancel the deletion
    const buttons = new MessageActionRow<MessageButton>()
      .addComponents(
        new MessageButton()
          .setCustomId(`delete${user!.id}`)
          .setLabel('Delete')
          .setStyle(Constants.MessageButtonStyles.DANGER),
        new MessageButton()
          .setCustomId(`cancel${user!.id}`)
          .setLabel('Cancel')
          .setStyle(Constants.MessageButtonStyles.SECONDARY),
      );

    // Sends the note to verify this note is to be deleted
    const message = await interaction.reply({
      embeds: [noteEmbed],
      components: [buttons],
      ephemeral: true,
      fetchReply: true,
    });

    // Checks if the message is not an APIMessage
    if (!isMessageInstance(message)) {
      await interaction.editReply('Failed to retrieve the message :(');
      return;
    }

    // Listen for the button presses
    const collector = channel!.createMessageComponentCollector({
      max: 1, // Maximum of 1 button press
      time: 15000, // 15 seconds
    });

    // Button pressed
    collector.on('collect', async (button: ButtonInteraction) => {
      if (button.customId === `delete${user!.id}`) {
        // Remove sus note from database
        await deactivateAllNotes(user!.id);
        await interaction.editReply({
          content: `Removed all of ${userGuildMember!}'s sus notes successfully`,
          embeds: [],
        });
      }
    });

    // Remove the buttons after they have been clicked
    collector.on('end', async () => {
      await interaction.editReply({
        components: [],
      });
    });

    // Remove sus role from the user
    await userGuildMember!.roles.remove(IDs.roles.restrictions.sus);
  }
}

export default SusCommand;
