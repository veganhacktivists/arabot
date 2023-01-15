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
import IDs from '../../utils/ids';

class GuestCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'guest',
      description: 'Gives the Guest role',
      preconditions: ['EventCoordinatorOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) => option.setName('user')
          .setDescription('User to give Guest role to')
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
    if (user === null || mod === null || guild === null) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Gets guildMember whilst removing the ability of each other variables being null
    const guildMember = guild.members.cache.get(user.id);
    const guest = guild.roles.cache.get(IDs.roles.guest);

    // Checks if guildMember is null
    if (guildMember === undefined || guest === undefined) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Checks if the user has Guest and to give them or remove them based on if they have it
    if (guildMember.roles.cache.has(IDs.roles.guest)) {
      // Remove the Guest role from the user
      await guildMember.roles.remove(guest);
      await interaction.reply({
        content: `Removed the ${guest.name} role from ${user}`,
        fetchReply: true,
      });
      return;
    }
    // Give Guest role to the user
    await guildMember.roles.add(guest);
    await interaction.reply({
      content: `Gave ${user} the ${guest.name} role!`,
      fetchReply: true,
    });

    await user.send(`You have been given the ${guest.name} role by ${mod}!`)
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
      await message.reply('Event coordinator not found! Try again or contact a developer!');
      return;
    }

    const { guild } = message;

    if (guild === null) {
      await message.react('❌');
      await message.reply('Guild not found! Try again or contact a developer!');
      return;
    }

    const guest = guild.roles.cache.get(IDs.roles.guest);

    if (guest === undefined) {
      await message.react('❌');
      await message.reply('Role not found! Try again or contact a developer!');
      return;
    }

    // Checks if the user has Guest and to give them or remove them based on if they have it
    if (user.roles.cache.has(IDs.roles.guest)) {
      // Remove the Guest role from the user
      await user.roles.remove(guest);
      await message.reply({
        content: `Removed the ${guest.name} role from ${user}`,
      });
    } else {
      // Give Guest role to the user
      await user.roles.add(guest);
      await message.reply({
        content: `Gave ${user} the ${guest.name} role!`,
      });
      await user.send(`You have been given the ${guest.name} role by ${mod}!`)
        .catch(() => {});
    }

    await message.react('✅');
  }
}

export default GuestCommand;
