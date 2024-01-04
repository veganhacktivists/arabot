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

export class RenameUserCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'rename',
      aliases: ['ru', 'nick'],
      description: 'Changes the nickname for the user',
      preconditions: [['CoordinatorOnly', 'ModOnly']],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addUserOption((option) =>
            option
              .setName('user')
              .setDescription('User to change nickname')
              .setRequired(true),
          )
          .addStringOption((option) =>
            option
              .setName('nickname')
              .setDescription('The nickname to give the user')
              .setMaxLength(32),
          ),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // TODO add database updates
    // Get the arguments
    const user = interaction.options.getUser('user', true);
    const nickname = interaction.options.getString('nickname');
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (guild === null) {
      await interaction.reply({
        content: 'Error fetching guild!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Gets guildMember whilst removing the ability of each other variables being null
    const member = guild.members.cache.get(user.id);

    // Checks if guildMember is null
    if (member === undefined) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Change nickname
    try {
      await member.setNickname(nickname);
    } catch {
      await interaction.reply({
        content: "Bot doesn't have permission to change the user's name!",
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }
    await interaction.reply({
      content: `Changed ${user}'s nickname`,
      fetchReply: true,
      ephemeral: true,
    });
  }

  public async messageRun(message: Message, args: Args) {
    // Get arguments
    let member: GuildMember;
    try {
      member = await args.pick('member');
    } catch {
      await message.react('❌');
      await message.reply('User was not provided!');
      return;
    }

    const nickname = args.finished ? null : await args.rest('string');

    if (nickname != null && nickname.length > 32) {
      await message.react('❌');
      await message.reply('Nickname is too long!');
      return;
    }

    try {
      await member.setNickname(nickname);
    } catch {
      await message.react('❌');
      await message.reply(
        "Bot doesn't have permission to change the user's name!",
      );
      return;
    }

    await message.react('✅');
  }
}
