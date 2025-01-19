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

import { Command, RegisterBehavior } from '@sapphire/framework';
import { Message, MessageFlagsBitField } from 'discord.js';

export class ApplyCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'apply',
      description: 'Apply to volunteer for Animal Rights Advocates',
    });
  }

  message =
    'If you want to help out in ARA and support animals at the same time, ' +
    "apply here: https://forms.gle/kgBHbB7LHFUJXhui6 and we'll try to get back as soon as possible!";

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder.setName(this.name).setDescription(this.description),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    await interaction.reply({
      content: this.message,
      flags: MessageFlagsBitField.Flags.Ephemeral,
      withResponse: true,
    });
  }

  public async messageRun(message: Message) {
    await message.reply(this.message);
  }
}
