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

import { Args, Command, RegisterBehavior } from '@sapphire/framework';
import type { GuildMember, Message } from 'discord.js';
import IDs from '../../utils/ids';

class PlusCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'plus',
      aliases: ['+'],
      description: 'Give/remove the plus role',
      preconditions: ['CoordinatorOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) => option.setName('user')
          .setDescription('User to give/remove plus to')
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
    const plus = guild.roles.cache.get(IDs.roles.vegan.plus);

    // Checks if guildMember is null
    if (guildMember === undefined || plus === undefined) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Checks if the user is not vegan
    if (!guildMember.roles.cache.has(IDs.roles.vegan.vegan)) {
      await interaction.reply({
        content: `${user} is not vegan!`,
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Checks if the user has Plus and to give them or remove them based on if they have it
    if (guildMember.roles.cache.has(IDs.roles.vegan.plus)) {
      // Remove the Plus role from the user
      await guildMember.roles.remove(plus);
      await interaction.reply({
        content: `Removed the ${plus.name} role from ${user}`,
        fetchReply: true,
      });
      return;
    }
    // Add Plus role to the user
    await guildMember.roles.add(plus);
    await interaction.reply({
      content: `Gave ${user} the ${plus.name} role!`,
      fetchReply: true,
    });
    await user.send(`You have been given the ${plus.name} role by ${mod}!`)
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
      await message.reply('Moderator not found! Try again or contact a developer!');
      return;
    }

    const { guild } = message;

    if (guild === null) {
      await message.react('❌');
      await message.reply('Guild not found! Try again or contact a developer!');
      return;
    }

    const plus = guild.roles.cache.get(IDs.roles.vegan.plus);

    if (plus === undefined) {
      await message.react('❌');
      await message.reply('Role not found! Try again or contact a developer!');
      return;
    }

    if (!user.roles.cache.has(IDs.roles.vegan.vegan)) {
      await message.react('❌');
      await message.reply(`${user} is not vegan!`);
      return;
    }

    // Checks if the user has Plus and to give them or remove them based on if they have it
    if (user.roles.cache.has(IDs.roles.vegan.plus)) {
      // Remove the Plus role from the user
      await user.roles.remove(plus);
      await message.reply({
        content: `Removed the ${plus.name} role from ${user}`,
      });
    } else {
      // Give Plus role to the user
      await user.roles.add(plus);
      await message.reply({
        content: `Gave ${user} the ${plus.name} role!`,
      });
      await user.send(`You have been given the ${plus.name} role by ${mod}!`)
        .catch(() => {});
    }

    await message.react('✅');
  }
}

export default PlusCommand;
