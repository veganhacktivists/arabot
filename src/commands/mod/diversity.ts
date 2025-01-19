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

// TODO This file needs a MASSIVE refactor

import { Args, container, RegisterBehavior } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import {
  GuildMember,
  Message,
  MessageFlagsBitField,
  PermissionsBitField,
} from 'discord.js';
import type { Snowflake } from 'discord.js';
import IDs from '#utils/ids';
import { getGuildMember, getRole, getTextBasedChannel } from '#utils/fetcher';
import {
  isGuildMember,
  isTextChannel,
  isThreadChannel,
} from '@sapphire/discord.js-utilities';
import { isRole } from '#utils/typeChecking';

export class DiversityCommand extends Subcommand {
  public constructor(
    context: Subcommand.LoaderContext,
    options: Subcommand.Options,
  ) {
    super(context, {
      ...options,
      name: 'diversity',
      aliases: ['di', 'div'],
      subcommands: [
        {
          name: 'role',
          default: true,
          chatInputRun: 'roleCommand',
          messageRun: 'roleMessage',
        },
        {
          name: 'toggleopen',
          chatInputRun: 'toggleOpen',
        },
      ],
      description: 'Commands for the Diversity Coordinators',
      preconditions: ['DiversityCoordinatorOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addSubcommand((command) =>
            command
              .setName('role')
              .setDescription('Gives/removes the diversity role')
              .addUserOption((option) =>
                option
                  .setName('user')
                  .setDescription('User to give/remove diversity to')
                  .setRequired(true),
              ),
          )
          .addSubcommand((command) =>
            command
              .setName('toggleopen')
              .setDescription(
                'Toggles read-only for vegans in diversity section',
              ),
          ),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async toggleOpen(interaction: Subcommand.ChatInputCommandInteraction) {
    // Get the channel
    const channel = await getTextBasedChannel(interaction.channelId);

    // Check if channel is text
    if (!isTextChannel(channel)) {
      await interaction.reply({
        content: 'Channel is not a text channel!',
        flags: MessageFlagsBitField.Flags.Ephemeral,
        withResponse: true,
      });
      return;
    }

    // Check if the command was run in the diversity section
    if (channel.parentId !== IDs.categories.diversity) {
      await interaction.reply({
        content: 'Command was not run in the Diversity section!',
        flags: MessageFlagsBitField.Flags.Ephemeral,
        withResponse: true,
      });
      return;
    }

    // Checks if the channel is open
    const open = channel
      .permissionsFor(IDs.roles.vegan.vegan)!
      .has([PermissionsBitField.Flags.SendMessages]);

    // Toggle send message in channel
    await channel.permissionOverwrites.edit(IDs.roles.vegan.vegan, {
      SendMessages: !open,
    });

    await interaction.reply({
      content: `${!open ? 'Opened' : 'Closed'} this channel.`,
      withResponse: true,
    });
  }

  public async roleCommand(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    // TODO add database updates
    // Get the arguments
    const user = interaction.options.getUser('user', true);
    const mod = interaction.member;
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (guild === null) {
      await interaction.reply({
        content: 'Error fetching the guild!',
        flags: MessageFlagsBitField.Flags.Ephemeral,
        withResponse: true,
      });
      return;
    }

    if (!isGuildMember(mod)) {
      await interaction.reply({
        content: 'Error fetching your user!',
        flags: MessageFlagsBitField.Flags.Ephemeral,
        withResponse: true,
      });
      return;
    }

    const member = await getGuildMember(user.id, guild);
    const diversity = await getRole(IDs.roles.staff.diversity, guild);

    // Checks if the member was found
    if (!isGuildMember(member)) {
      await interaction.reply({
        content: 'Error fetching the user!',
        flags: MessageFlagsBitField.Flags.Ephemeral,
        withResponse: true,
      });
      return;
    }

    // Checks if the role was found
    if (!isRole(diversity)) {
      await interaction.reply({
        content: 'Error fetching the diversity role!',
        flags: MessageFlagsBitField.Flags.Ephemeral,
        withResponse: true,
      });
      return;
    }

    // Checks if the user has Diversity and to give them or remove them based on if they have it
    if (member.roles.cache.has(IDs.roles.staff.diversity)) {
      // Remove the Diversity role from the user
      await member.roles.remove(diversity);
      await this.threadManager(member.id, false);
      await interaction.reply({
        content: `Removed the ${diversity.name} role from ${user}`,
        withResponse: true,
      });
      return;
    }
    // Add Diversity Team role to the user
    await member.roles.add(diversity);
    await this.threadManager(member.id, true);
    await interaction.reply({
      content: `Gave ${user} the ${diversity.name} role!`,
      withResponse: true,
    });
    await user
      .send(`You have been given the ${diversity.name} role by ${mod}!`)
      .catch(() => {});
  }

  public async roleMessage(message: Message, args: Args) {
    // Get arguments
    let user: GuildMember;
    try {
      user = await args.pick('member');
    } catch {
      await message.react('❌');
      await message.reply('User was not provided!');
      return;
    }

    const mod = message.member;

    if (!isGuildMember(mod)) {
      await message.react('❌');
      await message.reply(
        'Diversity coordinator not found! Try again or contact a developer!',
      );
      return;
    }

    const { guild } = message;

    if (guild === null) {
      await message.react('❌');
      await message.reply('Guild not found! Try again or contact a developer!');
      return;
    }

    const diversity = await getRole(IDs.roles.staff.diversity, guild);

    if (!isRole(diversity)) {
      await message.react('❌');
      await message.reply('Role not found! Try again or contact a developer!');
      return;
    }

    // Checks if the user has Diversity and to give them or remove them based on if they have it
    if (user.roles.cache.has(IDs.roles.staff.diversity)) {
      // Remove the Diversity Team role from the user
      await user.roles.remove(diversity);
      await this.threadManager(user.id, false);
      await message.reply({
        content: `Removed the ${diversity.name} role from ${user}`,
      });
    } else {
      // Give Diversity Team role to the user
      await user.roles.add(diversity);
      await this.threadManager(user.id, true);
      await message.reply({
        content: `Gave ${user} the ${diversity.name} role!`,
      });
      await user
        .send(`You have been given the ${diversity.name} role by ${mod}!`)
        .catch(() => {});
    }

    await message.react('✅');
  }

  private async threadManager(member: Snowflake, add: boolean) {
    const thread = await container.client.channels.fetch(
      IDs.channels.diversity.diversity,
    );

    if (!isThreadChannel(thread)) {
      return;
    }

    if (add) {
      await thread.members.add(member);
      return;
    }

    await thread.members.remove(member);
  }
}
