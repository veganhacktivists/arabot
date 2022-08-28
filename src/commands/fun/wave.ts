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
import { MessageEmbed } from 'discord.js';
import { Wave } from '../../utils/gifs';

export class WaveCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'wave',
      description: 'Wave to a user',
      preconditions: [['CoordinatorOnly', 'PatreonOnly']],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
          .setName(this.name)
          .setDescription(this.description)
          .addUserOption((option) => option
              .setName('user')
              .setDescription('User you want to wave to')
              .setRequired(true)
          ), { behaviorWhenNotIdentical: RegisterBehavior.Overwrite });
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    // Get the users
    // TODO exception handling
    const user = interaction.options.getUser('user')!;
    const waver = interaction.member!.user;
    const waverGuildMember = interaction.guild!.members.cache.get(waver.id)!;

    // Creates the embed for the wave
    const randomWave = Wave[Math.floor(Math.random() * Wave.length)];
    const waveEmbed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(`${waverGuildMember.displayName} waves at you, hello!`)
      .setImage(randomWave);

    // Send the wave
    await interaction.reply({
      content: `<@${user.id}>`,
      embeds: [waveEmbed],
      fetchReply: true,
    });
  }
}
