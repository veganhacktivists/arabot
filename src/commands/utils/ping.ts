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

import { isMessageInstance } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';
import type { Message } from 'discord.js';

export class PingCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'ping',
      description: 'Pings the bot',
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const msg = await interaction.reply({
      content: 'Ping?',
      ephemeral: true,
      fetchReply: true,
    });

    if (isMessageInstance(msg)) {
      const diff = msg.createdTimestamp - interaction.createdTimestamp;
      const ping = Math.round(this.container.client.ws.ping);
      return interaction.editReply(
        `Pong 🏓! (Round trip took: ${diff}ms. Heartbeat: ${ping}ms.)`,
      );
    }

    return interaction.editReply('Failed to retrieve ping :(');
  }

  public async messageRun(message: Message) {
    const msg = await message.channel.send('Ping?');

    const diff = msg.createdTimestamp - message.createdTimestamp;
    const ping = Math.round(this.container.client.ws.ping);

    return msg.edit(
      `Pong 🏓! (Round trip took: ${diff}ms. Heartbeat: ${ping}ms.)`,
    );
  }
}
