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
import { ChannelType } from 'discord.js';
import IDs from '#utils/ids';

export class AccessCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'access',
      description:
        'Manages channel permissions for ModMails, Private channels, and restricted channels',
      preconditions: ['CoordinatorOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addStringOption((option) =>
            option
              .setName('permission')
              .setDescription('Select permissions for the user/role')
              .setRequired(true)
              .addChoices(
                { name: 'Add', value: 'add' },
                { name: 'Read', value: 'read' },
                { name: 'Remove', value: 'remove' },
                { name: 'Reset', value: 'reset' },
              ),
          )
          .addChannelOption((option) =>
            option
              .setName('channel')
              .setDescription('Channel to change these permissions on')
              .setRequired(true),
          )
          .addUserOption((option) =>
            option
              .setName('user')
              .setDescription('User to set these permissions for'),
          )
          .addRoleOption((option) =>
            option
              .setName('role')
              .setDescription('Role to set these permissions for'),
          ),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // Check that the command was run in the Guild
    if (!interaction.inCachedGuild()) {
      await interaction.reply({
        content: 'This command can only be run in a server!',
        ephemeral: true,
      });
      return;
    }

    // Get the arguments
    const permission = interaction.options.getString('permission', true);
    const channel = interaction.options.getChannel('channel', true);
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');

    // Checks if all the variables are of the right type
    if (user === null && role === null) {
      await interaction.reply({
        content: 'Error fetching slash command data!',
        ephemeral: true,
      });
      return;
    }

    // If user and role is provided, the return an error
    if (user !== null && role !== null) {
      await interaction.reply({
        content:
          'You have entered a user and a role at the same time! Please only enter one at a time.',
        ephemeral: true,
      });
      return;
    }

    // Checks that the channel is a GuildText or GuildVoice, otherwise, return error
    if (
      channel.type !== ChannelType.GuildText &&
      channel.type !== ChannelType.GuildVoice
    ) {
      await interaction.reply({
        content: 'Please only select a text or voice channel!',
        ephemeral: true,
      });
      return;
    }

    // If the channel is not in the categories ModMail, Private, Restricted, the return error
    if (
      channel.parentId !== IDs.categories.modMail &&
      channel.parentId !== IDs.categories.private &&
      channel.parentId !== IDs.categories.restricted
    ) {
      await interaction.reply({
        content: 'Channel is not in ModMail/Private/Restricted category!',
        ephemeral: true,
      });
      return;
    }

    // Create variable for either User or Role to update permissions for
    let permId: string;
    if (user !== null) {
      permId = user.id;
    } else if (role !== null) {
      permId = role.id;
    } else {
      await interaction.reply({
        content: 'Could not find the role to edit permissions!',
        ephemeral: true,
      });
      return;
    }

    // Set permissions of voice channel
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
          });
          return;
      }
    } else {
      // Set permissions of text channel
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
          });
          return;
      }
    }

    await interaction.reply(`Successfully updated permissions for ${channel}`);
  }
}
