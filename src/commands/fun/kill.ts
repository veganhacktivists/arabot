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
import { Kill } from '../../utils/gifs';

export class KillCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'kill',
      description: 'Kill a user',
      preconditions: ['PatreonOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) => option.setName('user')
          .setDescription('User you want to kill')
          .setRequired(true)),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    // Get the users
    // TODO exception handling
    const user = interaction.options.getUser('user')!;
    const killer = interaction.member!.user;
    const killerGuildMember = interaction.guild!.members.cache.get(killer.id)!;

    // Creates the embed for the hug
    const randomKill = Kill[Math.floor(Math.random() * Kill.length)];
    const killEmbed = new MessageEmbed()
      .setColor('#ff0000')
      .setTitle(`Kill from ${killerGuildMember.displayName}`)
      .setImage(randomKill);

    // Send the hug
    await interaction.reply({ content: `<@${user.id}>`, embeds: [killEmbed], fetchReply: true });
  }
}
