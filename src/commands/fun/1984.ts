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

import { Command, RegisterBehavior } from '@sapphire/framework';
import { EmbedBuilder, MessageFlagsBitField } from 'discord.js';
import { N1984 } from '#utils/gifs';
import { addFunLog, countTotal } from '#utils/database/fun/fun';
import { isGuildMember } from '@sapphire/discord.js-utilities';

export class N1984Command extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: '1984',
      description: 'this is literally 1984',
      preconditions: [['CoordinatorOnly', 'ModOnly']],
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

    // Type checks
    if (!isGuildMember(member)) {
      await interaction.reply({
        content: 'Failed to fetch your user on the bot!',
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
      return;
    }

    await addFunLog(member.id, '1984');
    const count = await countTotal(member.id, '1984');

    let embedFooter: string;
    if (count === 1) {
      embedFooter = `${member.displayName} 1984'd the server for the first time!`;
    } else {
      embedFooter = `${member.displayName} 1984'd the server ${count} times!`;
    }

    // Creates the embed for the 1984 reaction
    // Add a 1 in 1000 chance of Dantas literally making ARA 1984
    const random1984 =
      Math.random() < 0.001
        ? 'https://c.tenor.com/0BwU0BjWYX4AAAAC/arthuria-dantas.gif'
        : N1984[Math.floor(Math.random() * N1984.length)];
    const n1984Embed = new EmbedBuilder()
      .setColor('#ffffff')
      .setTitle(`${member.displayName} is happy!`)
      .setImage(random1984)
      .setFooter({ text: embedFooter });

    // Send the embed
    await interaction.reply({ embeds: [n1984Embed], withResponse: true });
  }
}
