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
import { EmbedBuilder, GuildMember, MessageFlagsBitField } from 'discord.js';
import { Kill } from '#utils/gifs';
import { addFunLog, countTotal } from '#utils/database/fun/fun';

export class KillCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'kill',
      description: 'Kill a user',
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addUserOption((option) =>
            option
              .setName('user')
              .setDescription('User you want to kill')
              .setRequired(true),
          ),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // Get the users
    const user = interaction.options.getUser('user', true)!;
    const sender = interaction.member;

    // Type checks
    if (!(sender instanceof GuildMember)) {
      await interaction.reply({
        content: 'Failed to fetch your user on the bot!',
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
      return;
    }

    if (user.id === sender.id) {
      await interaction.reply('You changed your mind');
      return;
    }

    await addFunLog(sender.id, 'kill', user.id);
    const count = await countTotal(sender.id, 'kill', user.id);

    let embedFooter: string;
    if (count === 1) {
      embedFooter = `${sender.displayName} killed you for the first time!`;
    } else {
      embedFooter = `${sender.displayName} killed you ${count} times!`;
    }

    // Creates the embed for the kill
    const randomKill = Kill[Math.floor(Math.random() * Kill.length)];
    const killEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(`Kill from ${sender.displayName}`)
      .setImage(randomKill)
      .setFooter({ text: embedFooter });

    // Send the kill
    await interaction.reply({
      content: `${user}`,
      embeds: [killEmbed],
      withResponse: true,
    });
  }
}
