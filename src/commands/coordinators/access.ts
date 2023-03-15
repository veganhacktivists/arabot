// SPDX-License-Identifier: GPL-3.0-or-later
/*
    Animal Rights Advocates Discord Bot
    Copyright (C) 2023  Anthony Berg

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
import { ChannelType, TextChannel, VoiceChannel } from 'discord.js';
import IDs from '#utils/ids';

export class AccessCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'access',
      description: 'Manages channel permissions for ModMails, Private channels, and restricted channels',
      preconditions: ['CoordinatorOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) => option.setName('permission')
          .setDescription('Select permissions for the user/role')
          .setRequired(true)
          .addChoices(
            { name: 'Add', value: 'add' },
            { name: 'Read', value: 'read' },
            { name: 'Remove', value: 'remove' },
            { name: 'Reset', value: 'reset' },
          ))
        .addChannelOption((option) => option.setName('channel')
          .setDescription('Channel to change these permissions on')
          .setRequired(true))
        .addUserOption((option) => option.setName('user')
          .setDescription('User to set these permissions for'))
        .addRoleOption((option) => option.setName('role')
          .setDescription('Role to set these permissions for')),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // Get the arguments
    const permission = interaction.options.getString('permission', true);
    const parsedChannel = interaction.options.getChannel('channel', true);
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (guild === null
      || (user === null && role === null)) {
      await interaction.reply({
        content: 'Error fetching slash command data!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    if (user !== null && role !== null) {
      await interaction.reply({
        content: 'You have entered a user and a role at the same time! Please only enter one at a time.',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    if (parsedChannel.type !== ChannelType.GuildText
      && parsedChannel.type !== ChannelType.GuildVoice) {
      await interaction.reply({
        content: 'Please only select a text or voice channel!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    let channel: TextChannel | VoiceChannel | undefined;
    if (parsedChannel.type === ChannelType.GuildVoice) {
      channel = guild.channels.cache.get(parsedChannel.id) as VoiceChannel | undefined;
    } else {
      channel = guild.channels.cache.get(parsedChannel.id) as TextChannel | undefined;
    }

    if (channel === undefined) {
      await interaction.reply({
        content: 'Could not find channel!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    if (channel.parentId !== IDs.categories.modMail
      && channel.parentId !== IDs.categories.private
      && channel.parentId !== IDs.categories.restricted) {
      await interaction.reply({
        content: 'Channel is not in ModMail/Private/Restricted category!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    let permId: string;
    if (user !== null) {
      if (user.id === undefined) {
        await interaction.reply({
          content: 'Error getting user id!',
          ephemeral: true,
          fetchReply: true,
        });
        return;
      }
      permId = user.id;
    } else if (role !== null) {
      permId = role.id;
    } else {
      await interaction.reply({
        content: 'Could not find the role to edit permissions!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    if (channel.type === ChannelType.GuildVoice) {
      switch (permission) {
        case 'add':
          await channel.permissionOverwrites.create(permId, {
            ViewChannel: true,
            Connect: true,
            Speak: true,
            SendMessages: true,
            ReadMessageHistory: true,
          });
          break;
        case 'view':
          await channel.permissionOverwrites.create(permId, {
            ViewChannel: true,
            Connect: true,
            Speak: false,
            SendMessages: false,
            AddReactions: false,
            ReadMessageHistory: true,
          });
          break;
        case 'remove':
          await channel.permissionOverwrites.create(permId, {
            ViewChannel: false,
            Connect: false,
            Speak: false,
            SendMessages: false,
            ReadMessageHistory: false,
          });
          break;
        case 'reset':
          await channel.permissionOverwrites.delete(permId);
          break;
        default:
          await interaction.reply({
            content: 'Incorrect permission option!',
            ephemeral: true,
            fetchReply: true,
          });
          return;
      }
      return;
    }

    switch (permission) {
      case 'add':
        await channel.permissionOverwrites.create(permId, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });
        break;
      case 'view':
        await channel.permissionOverwrites.create(permId, {
          ViewChannel: true,
          SendMessages: false,
          AddReactions: false,
          ReadMessageHistory: true,
        });
        break;
      case 'remove':
        await channel.permissionOverwrites.create(permId, {
          ViewChannel: false,
          SendMessages: false,
          ReadMessageHistory: false,
        });
        break;
      case 'reset':
        await channel.permissionOverwrites.delete(permId);
        break;
      default:
        await interaction.reply({
          content: 'Incorrect permission option!',
          ephemeral: true,
          fetchReply: true,
        });
        return;
    }

    await interaction.reply({
      content: `Successfully updated permissions for ${channel}`,
      fetchReply: true,
    });
  }
}
