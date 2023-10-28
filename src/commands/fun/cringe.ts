// SPDX-License-Identifier: GPL-3.0-or-later
/*
    Animal Rights Advocates Discord Bot
    Copyright (C) 2023 Anthony Berg, Stefanie Merceron

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
import { EmbedBuilder } from 'discord.js';
import { Cringe } from '#utils/gifs';
import { addFunLog, countTotal } from '#utils/database/fun';

export class CringeCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'cringe',
      description: 'Express your cringe',
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder.setName(this.name).setDescription(this.description),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      }
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // Get the user
    // TODO exception handling
    const { user } = interaction;

    await addFunLog(user.id, 'cringe');
    const count = await countTotal(user.id, 'cringe');

    // Creates the embed for the cringe reaction
    const randomCringe = Cringe[Math.floor(Math.random() * Cringe.length)];
    const cringeEmbed = new EmbedBuilder()
      .setColor('#001148')
      .setTitle(`${user.username} feels immense cringe...`)
      .setImage(randomCringe)
      .setFooter({ text: `${user.username}'s cringe count: ${count}` });

    // Send the embed
    await interaction.reply({ embeds: [cringeEmbed], fetchReply: true });
  }
}
