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
import type { Message } from 'discord.js';

export class ClearCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'clear',
      description: 'Deletes 1-100 messages in bulk',
      preconditions: ['CoordinatorOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addIntegerOption((option) => option.setName('messages')
          .setDescription('Number of messages to clear')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(100)),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // Get the arguments
    const messages = interaction.options.getInteger('messages', true);
    const { channel } = interaction;

    if (channel === null
      || channel.isDMBased()) {
      await interaction.reply({
        content: 'Could not fetch channel!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    await channel.bulkDelete(messages);

    await interaction.reply({
      content: `Successfully deleted ${messages} messages!`,
      ephemeral: true,
      fetchReply: true,
    });
  }

  public async messageRun(message: Message, args: Args) {
    // Get arguments
    const messages = await args.pick('integer');

    if (messages > 100) {
      await message.react('❌');
      await message.reply('You can only clear up to 100 messages at a time!');
      return;
    }
    if (messages < 1) {
      await message.react('❌');
      await message.reply('You need to at least clear 1 message!');
      return;
    }

    const { channel } = message;

    if (!channel.isTextBased()
      || channel.isDMBased()) {
      await message.react('❌');
      await message.reply('Unsupported channel type!');
      return;
    }

    await channel.bulkDelete(messages);

    await message.reply(`Successfully deleted ${messages} messages!`);

    await message.react('✅');
  }
}
