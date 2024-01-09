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
import { EmbedBuilder, GuildMember } from 'discord.js';
import { Cringe } from '#utils/gifs';
import { addFunLog, countTotal } from '#utils/database/fun';

export class CringeCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
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
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // Get the user
    const { member } = interaction;

    // Type check
    if (!(member instanceof GuildMember)) {
      await interaction.reply({
        ephemeral: true,
        content: 'Failed to fetch your user on the bot!',
      });
      return;
    }

    await addFunLog(member.id, 'cringe');
    const count = await countTotal(member.id, 'cringe');

    let embedFooter: string;
    if (count === 1) {
      embedFooter = `${member.displayName} cringed for the first time!`;
    } else {
      embedFooter = `${member.displayName} cringed ${count} times!`;
    }

    // Creates the embed for the cringe reaction
    const randomCringe = Cringe[Math.floor(Math.random() * Cringe.length)];
    const cringeEmbed = new EmbedBuilder()
      .setColor('#001148')
      .setTitle(`${member.displayName} feels immense cringe...`)
      .setImage(randomCringe)
      .setFooter({ text: embedFooter });

    // Send the embed
    await interaction.reply({ embeds: [cringeEmbed], fetchReply: true });
  }
}
