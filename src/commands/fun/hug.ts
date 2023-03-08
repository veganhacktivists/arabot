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
import { Hugs } from '#utils/gifs';
import { addFunLog, countTotal } from '#utils/database/fun';

export class HugCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'hug',
      description: 'Hug a user',
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) => option.setName('user')
          .setDescription('User you want to hug')
          .setRequired(true)),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // Get the users
    const user = interaction.options.getUser('user', true);
    const hugger = interaction.user;

    await addFunLog(hugger.id, 'hug', user.id);
    const count = await countTotal(hugger.id, 'hug', user.id);

    // Creates the embed for the hug
    const randomHug = Hugs[Math.floor(Math.random() * Hugs.length)];
    const hugEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Hug from ${hugger.username}`)
      .setImage(randomHug)
      .setFooter({ text: `Amount of hugs given from ${hugger.username} to you: ${count}` });

    // Send the hug
    await interaction.reply({ content: `${user}`, embeds: [hugEmbed], fetchReply: true });
  }
}
