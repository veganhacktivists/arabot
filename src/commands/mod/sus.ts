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

import { RegisterBehavior, Args } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  User,
  Guild,
  TextChannel,
  GuildMember,
} from 'discord.js';
import type { Message } from 'discord.js';
import { isMessageInstance } from '@sapphire/discord.js-utilities';
import {
  addSusNoteDB,
  findNotes,
  getNote,
  deactivateNote,
  deactivateAllNotes,
} from '#utils/database/sus';
import { checkStaff } from '#utils/checker';
import IDs from '#utils/ids';
import { createSusLogEmbed } from '#utils/embeds';

// TODO add a check when they join the server to give the user the sus role again

export class SusCommand extends Subcommand {
  public constructor(
    context: Subcommand.LoaderContext,
    options: Subcommand.Options,
  ) {
    super(context, {
      ...options,
      name: 'sus',
      subcommands: [
        {
          name: 'add',
          default: true,
          chatInputRun: 'addNoteChatInput',
          messageRun: 'addNoteMessage',
        },
        {
          name: 'view',
          chatInputRun: 'listNote',
        },
        {
          name: 'remove',
          chatInputRun: 'removeNote',
        },
        {
          name: 'purge',
          chatInputRun: 'removeAllNotes',
        },
      ],
      description: 'Notes about users that are sus',
      preconditions: [['VerifierOnly', 'ModOnly']],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          // Subcommand to add a sus note
          .addSubcommand((command) =>
            command
              .setName('add')
              .setDescription('Add a sus note about a user')
              .addUserOption((option) =>
                option
                  .setName('user')
                  .setDescription('User to add the note')
                  .setRequired(true),
              )
              .addStringOption((option) =>
                option
                  .setName('note')
                  .setDescription('Note about the user')
                  .setRequired(true),
              ),
          )
          // Subcommand to list sus notes
          .addSubcommand((command) =>
            command
              .setName('view')
              .setDescription('View a sus note for a user')
              .addUserOption((option) =>
                option
                  .setName('user')
                  .setDescription('User to view the note of')
                  .setRequired(true),
              ),
          )
          // Subcommand to remove a specific sus note
          .addSubcommand((command) =>
            command
              .setName('remove')
              .setDescription('Remove a specific sus note')
              .addIntegerOption((option) =>
                option
                  .setName('id')
                  .setDescription('Sus note ID')
                  .setRequired(true),
              ),
          )
          // Subcommand to remove all sus notes
          .addSubcommand((command) =>
            command
              .setName('purge')
              .setDescription('Remove all sus notes from a user')
              .addUserOption((option) =>
                option
                  .setName('user')
                  .setDescription('User to remove the note from')
                  .setRequired(true),
              ),
          ),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Subcommand to add sus note
  public async addNoteChatInput(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    // Get the arguments
    const user = interaction.options.getUser('user', true);
    const note = interaction.options.getString('note', true);
    const mod = interaction.user;
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (!(guild instanceof Guild)) {
      await interaction.reply({
        content: 'Error fetching guild!',
        ephemeral: true,
      });
      return;
    }

    const info = await this.addNote(user, mod, note, guild);

    await interaction.reply({
      content: info.message,
      ephemeral: true,
    });
  }

  // Non Application Command method of adding a sus note
  public async addNoteMessage(message: Message, args: Args) {
    // Get arguments
    let user: User;
    try {
      user = await args.pick('user');
    } catch {
      await message.react('❌');
      await message.reply('User was not provided!');
      return;
    }
    const note = args.finished ? null : await args.rest('string');
    const mod = message.author;

    if (note === null) {
      await message.react('❌');
      await message.reply('No sus note was provided!');
      return;
    }

    const guild = message.guild;

    if (!(guild instanceof Guild)) {
      await message.react('❌');
      await message.reply(
        'Could not find guild! Make sure you run this command in a server.',
      );
      return;
    }

    const info = await this.addNote(user, mod, note, guild);

    if (!info.success) {
      await message.react('❌');
      return;
    }

    await message.react('✅');
  }

  private async addNote(user: User, mod: User, note: string, guild: Guild) {
    const info = {
      message: '',
      success: false,
    };

    // Get GuildMember for user to add a sus note for
    let member = guild.members.cache.get(user.id);

    // Checks if Member was not found in cache
    if (member === undefined) {
      // Fetches Member from API call to Discord
      member = await guild.members.fetch(user.id);
      if (member === undefined) {
        info.message = 'Error fetching user';
        return info;
      }
    }

    // Add the data to the database
    await addSusNoteDB(user.id, mod.id, note);

    // Give the user the sus role they don't already have the sus note
    if (!member.roles.cache.has(IDs.roles.restrictions.sus)) {
      await member.roles.add(IDs.roles.restrictions.sus);
    }

    info.message = `Added the sus note for ${user}: ${note}`;
    info.success = true;

    // Log the sus note
    let logChannel = guild.channels.cache.get(IDs.channels.logs.sus) as
      | TextChannel
      | undefined;

    if (logChannel === undefined) {
      logChannel = (await guild.channels.fetch(IDs.channels.logs.sus)) as
        | TextChannel
        | undefined;
      if (logChannel === undefined) {
        this.container.logger.error('Sus Error: Could not fetch log channel');
        info.message = `Added a sus note for ${user} but could not find the log channel. This has been logged to the database.`;
        return info;
      }
    }

    const message = new EmbedBuilder()
      .setColor('#0099ff')
      .setAuthor({
        name: `Added sus note for ${user.tag}`,
        iconURL: `${user.displayAvatarURL()}`,
      })
      .addFields(
        { name: 'User', value: `${user}`, inline: true },
        { name: 'Moderator', value: `${mod}`, inline: true },
        { name: 'Note', value: note },
      )
      .setTimestamp()
      .setFooter({ text: `ID: ${user.id}` });

    await logChannel.send({ embeds: [message] });

    return info;
  }

  public async listNote(interaction: Subcommand.ChatInputCommandInteraction) {
    // Get the arguments
    const user = interaction.options.getUser('user', true);
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (guild == null) {
      await interaction.reply({
        content: 'Error fetching guild!',
        ephemeral: true,
      });
      return;
    }

    const staffChannel = checkStaff(interaction.channel);

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
    const noteEmbed = createSusLogEmbed(notes, user, guild);

    // Sends the notes to the user
    await interaction.reply({
      embeds: [noteEmbed],
      ephemeral: !staffChannel,
      fetchReply: true,
    });
  }

  public async removeNote(interaction: Subcommand.ChatInputCommandInteraction) {
    // Get the arguments
    const noteId = interaction.options.getInteger('id', true);
    const { guild, channel } = interaction;

    // Checks if all the variables are of the right type
    if (guild === null || channel === null) {
      await interaction.reply({
        content: 'Error fetching guild or channel!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

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

    const userId = note.userId;
    const modId = note.modId;

    // Get user GuildMembers for user and mod and person who ran command
    const user = this.container.client.users.cache.get(note.userId);
    const mod = this.container.client.users.cache.get(note.modId);

    let userDisplay = userId;
    if (user instanceof User) {
      userDisplay = user.tag;
    }

    let modDisplay = modId;
    if (mod instanceof User) {
      modDisplay = mod.displayName;
    }

    // Create an embed for the note
    const noteEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(`Sus note for ${userDisplay}`)
      .setThumbnail(user!.displayAvatarURL())
      .addFields({
        name: `ID: ${noteId} | Moderator: ${modDisplay} | Date: <t:${Math.floor(
          note.time.getTime() / 1000,
        )}>`,
        value: note.note,
      });

    // Create buttons to delete or cancel the deletion
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`delete${noteId}`)
        .setLabel('Delete')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`cancel${noteId}`)
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary),
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
    const collector = channel.createMessageComponentCollector({
      max: 1, // Maximum of 1 button press
      time: 15000, // 15 seconds
    });

    // Button pressed
    collector.on('collect', async (button: ButtonInteraction) => {
      if (button.customId === `delete${noteId}`) {
        await deactivateNote(noteId);
        await interaction.editReply({
          content: `${
            user instanceof User ? user : userDisplay
          }'s sus note (ID: ${noteId}) has been successfully removed`,
          embeds: [],
        });

        // TODO create a new Prisma function to only count and not to get a whole list of sus notes
        // Check how many notes the user has and if 0, then remove sus note
        const notes = await findNotes(userId, true);

        // Checks if there are no notes on the user and if there's none, remove the sus role
        if (notes.length === 0) {
          let member = guild.members.cache.get(userId);
          if (!(member instanceof GuildMember)) {
            member = await guild.members.fetch(userId).catch(() => undefined);
          }

          if (member instanceof GuildMember) {
            await member.roles.remove(IDs.roles.restrictions.sus);
          }
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

  public async removeAllNotes(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    // Get the arguments
    const user = interaction.options.getUser('user', true);
    const { guild, channel } = interaction;

    // Checks if all the variables are of the right type
    if (guild === null || channel === null) {
      await interaction.reply({
        content: 'Error fetching guild or channel!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    const member = guild.members.cache.get(user.id);

    // Checks if managed to find GuildMember for the user
    if (member === undefined) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Check if the user had sus notes before trying to remove them
    // Gets the sus notes from the database
    const notes = await findNotes(user.id, true);

    // Checks if there are no notes on the user
    if (notes.length === 0) {
      await interaction.reply({
        content: `${user} had no notes!`,
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Creates the embed to display the sus note
    const noteEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(`Delete ${notes.length} sus notes for ${user.username}?`)
      .setThumbnail(user.displayAvatarURL());

    // Add up to 10 of the latest sus notes to the embed
    for (
      let i = notes.length > 10 ? notes.length - 10 : 0;
      i < notes.length;
      i += 1
    ) {
      // Get mod name
      let mod = notes[i].modId;
      const modGuildMember = guild.members.cache.get(mod);
      if (modGuildMember !== undefined) {
        mod = modGuildMember.displayName;
      }
      // Add sus note to embed
      noteEmbed.addFields({
        name: `Sus ID: ${
          notes[i].id
        } | Moderator: ${mod} | Date: <t:${Math.floor(
          notes[i].time.getTime() / 1000,
        )}>`,
        value: notes[i].note,
      });
    }

    // Create buttons to delete or cancel the deletion
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`delete${user.id}`)
        .setLabel('Delete')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`cancel${user.id}`)
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary),
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
    const collector = channel.createMessageComponentCollector({
      max: 1, // Maximum of 1 button press
      time: 15000, // 15 seconds
    });

    // Button pressed
    collector.on('collect', async (button: ButtonInteraction) => {
      if (button.customId === `delete${user.id}`) {
        // Remove sus note from database
        await deactivateAllNotes(user.id);
        await interaction.editReply({
          content: `Removed all of ${member}'s sus notes successfully`,
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
    await member.roles.remove(IDs.roles.restrictions.sus);
  }
}
