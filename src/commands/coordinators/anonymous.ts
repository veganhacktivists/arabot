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
import { ChannelType, TextChannel } from 'discord.js';

export class AnonymousCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'anonymous',
      aliases: ['anon'],
      description: 'Bot sends a message for you',
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
              .setName('message')
              .setDescription('The message the bot will send')
              .setRequired(true),
          )
          .addChannelOption((option) =>
            option
              .setName('channel')
              .setDescription('The channel the bot will send the message'),
          ),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // Get the arguments
    const message = interaction.options.getString('message', true);
    let channel = interaction.options.getChannel('channel');
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

    if (channel === null) {
      if (interaction.channel === null) {
        await interaction.reply({
          content: 'Error getting the channel!',
          ephemeral: true,
          fetchReply: true,
        });
        return;
      }

      await interaction.channel.send(message);
      await interaction.reply({
        content: 'Sent the message',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    if (channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: 'Could not send, unsupported text channel!',
        ephemeral: true,
        fetchReply: true,
      });
    }

    channel = channel as TextChannel;
    await channel.send(message);

    await interaction.reply({
      content: 'Sent the message',
      ephemeral: true,
      fetchReply: true,
    });
  }

  public async messageRun(message: Message, args: Args) {
    // Get arguments
    const channel = await args.pick('channel');
    const text = args.finished ? null : await args.rest('string');

    if (text === null) {
      await message.react('❌');
      await message.reply('No message was provided!');
      return;
    }

    if (channel.isTextBased()) {
      await channel.send(text);
    } else {
      await message.react('❌');
      await message.reply('No channel was provided!');
      return;
    }

    await message.react('✅');
  }
}
