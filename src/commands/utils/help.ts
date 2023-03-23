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
 */

import { Command } from '@sapphire/framework';
import type { Message } from 'discord.js';

export class HelpCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'help',
      description: 'Provides a list of all the commands from this bot',
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) => builder
      .setName(this.name)
      .setDescription(this.description));
  }

  message = 'For a list of all the commands, visit: https://github.com/veganhacktivists/arabot/blob/main/docs/COMMANDS.md';

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    return interaction.reply(this.message);
  }

  public async messageRun(message: Message) {
    return message.channel.send(this.message);
  }
}
