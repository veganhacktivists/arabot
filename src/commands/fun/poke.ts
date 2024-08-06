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
import { EmbedBuilder, GuildMember } from 'discord.js';
import { Poke } from '#utils/gifs';
import { addFunLog, countTotal } from '#utils/database/fun/fun';

export class PokeCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'poke',
      description: 'Poke a user',
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
              .setDescription('User you want to poke')
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
        ephemeral: true,
        content: 'Failed to fetch your user on the bot!',
      });
      return;
    }

    await addFunLog(sender.id, 'poke', user.id);
    const count = await countTotal(sender.id, 'poke', user.id);

    let embedFooter: string;
    if (sender.id === user.id) {
      if (count === 1) {
        embedFooter = `You poked yourself for the first time!`;
      } else {
        embedFooter = `You poked yourself ${count} times!`;
      }
    } else {
      if (count === 1) {
        embedFooter = `${sender.displayName} poked you for the first time!`;
      } else {
        embedFooter = `${sender.displayName} poked you ${count} times!`;
      }
    }

    // Creates the embed for the poke
    const randomPoke = Poke[Math.floor(Math.random() * Poke.length)];
    const pokeEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Poke from ${sender.displayName}`)
      .setImage(randomPoke)
      .setFooter({ text: embedFooter });

    // Send the poke
    await interaction.reply({
      content: `${user}`,
      embeds: [pokeEmbed],
      fetchReply: true,
    });
  }
}
