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
import { Shrug } from '#utils/gifs';
import { isGuildMember } from '@sapphire/discord.js-utilities';

export class ShrugCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'shrug',
      description: 'Ugh... whatever... idk...',
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

    // Creates the embed for the shrug reaction
    const randomShrug = Shrug[Math.floor(Math.random() * Shrug.length)];
    const shrugEmbed = new EmbedBuilder()
      .setColor('#001980')
      .setTitle(`${member.displayName} shrugs`)
      .setImage(randomShrug);

    // Send the embed
    await interaction.reply({ embeds: [shrugEmbed], withResponse: true });
  }
}
