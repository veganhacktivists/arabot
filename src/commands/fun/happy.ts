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
import { Happy } from '#utils/gifs';

class HappyCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'happy',
      description: 'Express your happiness',
      preconditions: [['CoordinatorOnly', 'PatreonOnly']],
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

    // Creates the embed for the happy reaction
    const randomHappy = Happy[Math.floor(Math.random() * Happy.length)];
    const happyEmbed = new EmbedBuilder()
      .setColor('#40ff00')
      .setTitle(`${memberGuildMember.displayName} is happy!`)
      .setImage(randomHappy);

    // Send the embed
    await interaction.reply({ embeds: [happyEmbed], fetchReply: true });
  }
}

export default HappyCommand;
