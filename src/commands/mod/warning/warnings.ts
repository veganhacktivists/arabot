// SPDX-License-Identifier: GPL-3.0-or-later
/*
    Animal Rights Advocates Discord Bot
    Copyright (C) 2024  Anthony Berg

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

import { Args, Command, RegisterBehavior } from '@sapphire/framework';
import { ChannelType, EmbedBuilder } from 'discord.js';
import type { Message, Guild, User } from 'discord.js';
import IDs from '#utils/ids';
import { fetchWarnings } from '#utils/database/moderation/warnings';
import { checkStaff } from '#utils/checker';
import { createWarningsEmbed } from '#utils/embeds';

export class WarningsCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'warnings',
      aliases: ['warninglog', 'warnlog'],
      description: 'Shows all the warnings for the user',
      preconditions: ['ModOnly'],
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
              .setDescription('User to check the warnings for')
              .setRequired(true),
          ),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // Get the arguments
    const user = interaction.options.getUser('user', true);
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (guild === null) {
      await interaction.reply({
        content: 'Error fetching guild!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    const staffChannel = checkStaff(interaction.channel);

    await interaction.deferReply({ ephemeral: !staffChannel });

    const info = await this.warnings(user, guild);

    await interaction.editReply({
      content: info.message,
      embeds: info.embeds,
    });
  }

  // Non Application Command method for fetching warnings
  public async messageRun(message: Message, args: Args) {
    // Get arguments
    let user: User | undefined;
    try {
      user = await args.pick('user');
    } catch {
      user = undefined;
    }

    const { guild } = message;

    if (guild === null) {
      await message.react('❌');
      await message.reply('Guild not found! Try again or contact a developer!');
      return;
    }

    if (user === undefined) {
      const { channel } = message;

      if (channel.type !== ChannelType.GuildText) {
        await message.react('❌');
        await message.reply('User was not provided!');
        return;
      }

      let topic: string[];

      if (channel.parentId === IDs.categories.modMail) {
        // Checks if the channel topic has the user's snowflake
        if (channel.topic !== null) {
          topic = channel.topic.split(' ');
          // eslint-disable-next-line prefer-destructuring
          const userId = topic[2];

          user = guild.client.users.cache.get(userId);

          if (user === undefined) {
            user = await guild.client.users.fetch(userId);
          }
        }
      }
    }

    if (user === undefined) {
      await message.react('❌');
      await message.reply('User was not provided!');
      return;
    }

    const info = await this.warnings(user, guild);

    await message.reply({ content: info.message, embeds: info.embeds });
  }

  private async warnings(user: User, guild: Guild) {
    const info = {
      message: '',
      embeds: [] as EmbedBuilder[],
    };

    const warnings = await fetchWarnings(user.id);

    if (warnings.length === 0) {
      info.message = `${user} user has no warnings.`;
      return info;
    }

    // Creates an embed to display the warnings
    const embed = createWarningsEmbed(warnings, user, guild);

    info.embeds.push(embed);
    return info;
  }
}
