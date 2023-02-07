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
import { EmbedBuilder } from 'discord.js';
import { N1984 } from '#utils/gifs';

class N1984Command extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: '1984',
      description: 'this is literally 1984',
      preconditions: ['ModOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // Get the user
    // TODO exception handling
    const member = interaction.member!.user;
    const memberGuildMember = interaction.guild!.members.cache.get(member.id)!;

    // Creates the embed for the 1984 reaction
    // Add a 1 in 1000 chance of Dantas literally making ARA 1984
    const random1984 = Math.random() < 0.001 ? 'https://c.tenor.com/0BwU0BjWYX4AAAAC/arthuria-dantas.gif'
      : N1984[Math.floor(Math.random() * N1984.length)];
    const n1984Embed = new EmbedBuilder()
      .setColor('#ffffff')
      .setTitle(`${memberGuildMember.displayName} is happy!`)
      .setImage(random1984);

    // Send the embed
    await interaction.reply({ embeds: [n1984Embed], fetchReply: true });
  }
}

export default N1984Command;
