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
import { EmbedBuilder, TextChannel } from 'discord.js';
import type { Message, Guild, User } from 'discord.js';
import IDs from '#utils/ids';
import { deleteWarning, fetchWarning } from '#utils/database/moderation/warnings';
import { checkStaff } from '#utils/checker';

export class DeleteWarningCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'deletewarning',
      aliases: ['delwarn', 'removewarning'],
      description: 'Deletes a warning',
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
          .addIntegerOption((option) =>
            option
              .setName('id')
              .setDescription('ID for the warning')
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
    const warningId = interaction.options.getInteger('id', true);
    const mod = interaction.user;
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

    const info = await this.deleteWarning(warningId, mod, guild);

    await interaction.editReply({
      content: info.message,
      embeds: info.embeds,
    });
  }

  // Non Application Command method for removing a warning
  public async messageRun(message: Message, args: Args) {
    // Get arguments
    let warningId: number;
    try {
      warningId = await args.pick('integer');
    } catch {
      await message.react('❌');
      await message.react('Correct warning ID not provided!');
      return;
    }

    const mod = message.author;

    const { guild } = message;

    if (guild === null) {
      await message.react('❌');
      await message.reply('Guild not found! Try again or contact a developer!');
      return;
    }

    const info = await this.deleteWarning(warningId, mod, guild);

    await message.reply({ content: info.message, embeds: info.embeds });
    if (!info.success) {
      await message.react('❌');
    }
  }

  private async deleteWarning(warningId: number, mod: User, guild: Guild) {
    const info = {
      message: '',
      embeds: [] as EmbedBuilder[],
      success: false,
    };

    const warning = await fetchWarning(warningId);

    if (warning === null) {
      info.message = `Warning ID \`${warningId}\` not found!`;
      return info;
    }

    await deleteWarning(warningId);
    info.success = true;

    const userId = warning.userId;
    let user = guild.client.users.cache.get(userId);

    if (user === undefined) {
      user = await guild.client.users.fetch(userId);
      if (user === undefined) {
        info.message = `Deleted warning ID \`${warningId}\`, but the user could not be found!`;
        return info;
      }
    }

    // Log the warnings deletion
    let logChannel = guild.channels.cache.get(IDs.channels.logs.sus) as
      | TextChannel
      | undefined;

    if (logChannel === undefined) {
      logChannel = (await guild.channels.fetch(IDs.channels.logs.sus)) as
        | TextChannel
        | undefined;
      if (logChannel === undefined) {
        this.container.logger.error(
          'Delete Warning Error: Could not fetch log channel',
        );
        info.message =
          `Deleted warning for ${user} (Warning ID: ${warningId} but ` +
          'could not find the log channel.';
        return info;
      }
    }

    const message = new EmbedBuilder()
      .setColor('#28A745')
      .setAuthor({
        name: `Removed warning for ${user.tag}`,
        iconURL: `${user.displayAvatarURL()}`,
      })
      .addFields(
        { name: 'User', value: `${user}`, inline: true },
        { name: 'Moderator', value: `${mod}`, inline: true },
        { name: 'Warning ID', value: `${warningId}`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: `ID: ${userId}` });

    await logChannel.send({ embeds: [message] });

    info.message = `Deleted warning for ${user}`;
    return info;
  }
}
