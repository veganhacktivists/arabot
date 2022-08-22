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
import type { TextChannel } from 'discord.js';
import IDs from '../../utils/ids';

class ToggleOpenCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'diversity',
      description: 'Commands for the Diversity Coordinators',
      preconditions: ['DiversityCoordinatorOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand((command) => command.setName('toggleopen')
          .setDescription('Toggles read-only for vegans in diversity section')),
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
      case 'toggleopen': {
        return await this.toggleOpen(interaction);
      }
    }

    // If subcommand is invalid
    await interaction.reply({
      content: 'Invalid sub command!',
      ephemeral: true,
      fetchReply: true,
    });
  }

  // Command run
  public async toggleOpen(interaction: Command.ChatInputInteraction) {
    // Check if guild is not null
    if (interaction.guild === null) {
      await interaction.reply({
        content: 'Guild not found!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Get the channel
    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    // Check if channel is not undefined
    if (channel === undefined) {
      await interaction.reply({
        content: 'Channel not found!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Check if channel is text
    if (!channel.isText()) {
      await interaction.reply({
        content: 'Channel is not a text channel!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Converts GuildBasedChannel to TextChannel
    const channelText = channel as TextChannel;

    // Check if the command was run in the diversity section
    if (channel.parentId !== IDs.categories.diversity) {
      await interaction.reply({
        content: 'Command was not run in the Diversity section!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Checks if the channel is open
    const open = channel.permissionsFor(IDs.roles.vegan.vegan)!.has(['SEND_MESSAGES']);

    // Toggle send message in channel
    await channelText.permissionOverwrites.edit(IDs.roles.vegan.vegan, { SEND_MESSAGES: !open });

    await interaction.reply({
      content: `${!open ? 'Opened' : 'Closed'} this channel.`,
      fetchReply: true,
    });
  }
}

export default ToggleOpenCommand;
