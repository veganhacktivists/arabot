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

import { Args, Command, RegisterBehavior } from '@sapphire/framework';
import type { GuildMember, Message } from 'discord.js';
import IDs from '#utils/ids';

export class RestrictedAccessCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'restrictedaccess',
      aliases: ['ra'],
      description: 'Gives/removes the restricted access role',
      preconditions: ['ModCoordinatorOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) => option.setName('user')
          .setDescription('User to give/remove restricted access role')
          .setRequired(true)),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // TODO add database updates
    // Get the arguments
    const user = interaction.options.getUser('user');
    const mod = interaction.member;
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (user === null || guild === null || mod === null) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Gets guildMember whilst removing the ability of each other variables being null
    const guildMember = guild.members.cache.get(user.id);
    const restrictedAccess = guild.roles.cache.get(IDs.roles.staff.restricted);

    // Checks if guildMember is null
    if (guildMember === undefined || restrictedAccess === undefined) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Checks if the user has RA and to give them or remove them based on if they have it
    if (guildMember.roles.cache.has(IDs.roles.staff.restricted)) {
      // Remove the Restricted Access role from the user
      await guildMember.roles.remove(restrictedAccess);
      await interaction.reply({
        content: `Removed the ${restrictedAccess.name} role from ${user}`,
        fetchReply: true,
      });
      return;
    }
    // Add Restricted Access role to the user
    await guildMember.roles.add(restrictedAccess);
    await interaction.reply({
      content: `Gave ${user} the ${restrictedAccess.name} role!`,
      fetchReply: true,
    });
    await user.send(`You have been given the ${restrictedAccess.name} role by ${mod}!`)
      .catch(() => {});
  }

  public async messageRun(message: Message, args: Args) {
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

    if (mod === null) {
      await message.react('❌');
      await message.reply('Moderator coordinator not found! Try again or contact a developer!');
      return;
    }

    const { guild } = message;

    if (guild === null) {
      await message.react('❌');
      await message.reply('Guild not found! Try again or contact a developer!');
      return;
    }

    const restrictedAccess = guild.roles.cache.get(IDs.roles.staff.restricted);

    if (restrictedAccess === undefined) {
      await message.react('❌');
      await message.reply('Role not found! Try again or contact a developer!');
      return;
    }

    // Checks if the user has RA and to give them or remove them based on if they have it
    if (user.roles.cache.has(IDs.roles.staff.restricted)) {
      // Remove the Restricted Access role from the user
      await user.roles.remove(restrictedAccess);
      await message.reply({
        content: `Removed the ${restrictedAccess.name} role from ${user}`,
      });
    } else {
      // Give Restricted Access role to the user
      await user.roles.add(restrictedAccess);
      await message.reply({
        content: `Gave ${user} the ${restrictedAccess.name} role!`,
      });
      await user.send(`You have been given the ${restrictedAccess.name} role by ${mod}!`)
        .catch(() => {});
    }

    await message.react('✅');
  }
}
