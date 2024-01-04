// SPDX-License-Identifier: GPL-3.0-or-later
/*
    Animal Rights Advocates Discord Bot
    Copyright (C) 2023  Anthony Berg

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
import type { Message } from 'discord.js';
import IDs from '#utils/ids';

export class RenameUserCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'count',
      description: 'Displays how many vegans and non-vegans there are',
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
    const { guild } = interaction;

    if (guild === null) {
      await interaction.reply({
        content: 'Error fetching guild!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    await guild.members.fetch();

    const vegan = await guild.roles.cache.get(IDs.roles.vegan.vegan);
    const notVegan = await guild.roles.cache.get(IDs.roles.nonvegan.nonvegan);

    if (vegan === undefined || notVegan === undefined) {
      await interaction.reply({
        content: 'Error fetching roles!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    await interaction.reply({
      content:
        `${vegan.name}s: \`${vegan.members.size}\`` +
        `\n${notVegan.name}s: \`${notVegan.members.size}\``,
      fetchReply: true,
    });
  }

  public async messageRun(message: Message) {
    const { guild } = message;

    if (guild === null) {
      await message.react('❌');
      await message.reply(
        'Guild not found, please try again or contact a developer!',
      );
      return;
    }

    await guild.members.fetch();

    const vegan = await guild.roles.cache.get(IDs.roles.vegan.vegan);
    const notVegan = await guild.roles.cache.get(IDs.roles.nonvegan.nonvegan);

    if (vegan === undefined || notVegan === undefined) {
      await message.react('❌');
      await message.reply({
        content: 'Error fetching roles!',
      });
      return;
    }

    await message.reply({
      content:
        `${vegan.name}s: \`${vegan.members.size}\`` +
        `\n${notVegan.name}s: \`${notVegan.members.size}\``,
    });

    await message.react('✅');
  }
}
