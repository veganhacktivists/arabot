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
import { GuildMember, Message, MessageFlagsBitField } from 'discord.js';
import IDs from '#utils/ids';

export class SoftMuteCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'softmute',
      aliases: ['sm'],
      description:
        'Prevent a user from reacting to a message by giving ' +
        'the soft mute role',
      preconditions: ['ModOnly'],
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
              .setDescription('User to soft mute')
              .setRequired(true),
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

    // Gets guildMember whilst removing the ability of each other variables being null
    const guildMember = guild.members.cache.get(user.id);

    // Checks if guildMember is null
    if (guildMember === undefined) {
      await interaction.reply({
        content: 'Error fetching user!',
        flags: MessageFlagsBitField.Flags.Ephemeral,
        withResponse: true,
      });
      return;
    }

    if (guildMember.roles.cache.has(IDs.roles.restrictions.softMute)) {
      await guildMember.roles.remove(IDs.roles.restrictions.softMute);
      await interaction.reply({
        content: `Removed soft muted for ${user}`,
        withResponse: true,
      });
      return;
    }

    await guildMember.roles.add(IDs.roles.restrictions.softMute);

    await interaction.reply({
      content: `Soft muted ${user}`,
      withResponse: true,
    });
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

    if (user.roles.cache.has(IDs.roles.restrictions.softMute)) {
      await user.roles.remove(IDs.roles.restrictions.softMute);
      await message.reply(`Removed soft mute for ${user}`);
    } else {
      await user.roles.add(IDs.roles.restrictions.softMute);
      await message.reply(`Soft muted ${user}`);
    }

    await message.react('✅');
  }
}
