// SPDX-License-Identifier: GPL-3.0-or-later
/*
    Animal Rights Advocates Discord Bot
    Copyright (C) 2023, 2024  Anthony Berg

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

import {
  Args,
  Command,
  container,
  RegisterBehavior,
} from '@sapphire/framework';
import type { User, Message, Snowflake, Guild, TextChannel } from 'discord.js';
import { updateUser } from '#utils/database/dbExistingUser';
import { addWarn } from '#utils/database/warnings';
import { EmbedBuilder } from 'discord.js';
import IDs from '#utils/ids';

export class WarnCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'warn',
      description: 'Warns a user',
      preconditions: [['CoordinatorOnly', 'ModOnly']],
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
              .setDescription('User to warn')
              .setRequired(true),
          )
          .addStringOption((option) =>
            option
              .setName('reason')
              .setDescription('Reason for the warning')
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
    const reason = interaction.options.getString('reason', true);
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

    await interaction.deferReply();

    const info = await this.warn(user.id, mod.id, reason, guild);

    await interaction.editReply({
      content: info.message,
    });
  }

  // Non Application Command method for warning a user
  public async messageRun(message: Message, args: Args) {
    // Get arguments
    let user: User;
    try {
      user = await args.pick('user');
    } catch {
      await message.react('❌');
      await message.reply('User was not provided!');
      return;
    }
    const reason = args.finished ? null : await args.rest('string');
    const mod = message.member;

    if (reason === null) {
      await message.react('❌');
      await message.reply('Warn reason was not provided!');
      return;
    }

    if (mod === null) {
      await message.react('❌');
      await message.reply(
        'Moderator not found! Try again or contact a developer!',
      );
      return;
    }

    const { guild } = message;

    if (guild === null) {
      await message.react('❌');
      await message.reply('Guild not found! Try again or contact a developer!');
      return;
    }

    const warn = await this.warn(user.id, mod.id, reason, guild);

    if (!warn.success) {
      await message.react('❌');
      return;
    }

    await message.react('✅');
  }

  private async warn(
    userId: Snowflake,
    modId: Snowflake,
    reason: string,
    guild: Guild,
  ) {
    const info = {
      message: '',
      success: false,
    };

    // Gets mod's GuildMember
    const mod = guild.members.cache.get(modId);

    // Checks if guildMember is null
    if (mod === undefined) {
      info.message = 'Error fetching mod!';
      return info;
    }

    // Check if mod is in database
    await updateUser(mod);

    // Gets User for person being restricted
    let user = guild.client.users.cache.get(userId);

    if (user === undefined) {
      user = await guild.client.users.fetch(userId);
      if (user === undefined) {
        info.message = 'Error fetching user';
        return info;
      }
    }

    await addWarn(userId, modId, reason);

    info.message = `Warned ${user}`;
    info.success = true;

    // DM the reason

    const dmEmbed = new EmbedBuilder()
      .setColor('#FF6700')
      .setAuthor({
        name: "You've been warned!",
        iconURL: `${user.displayAvatarURL()}`,
      })
      .addFields({ name: 'Reason', value: reason })
      .setTimestamp();

    await user.send({ embeds: [dmEmbed] }).catch(() => {});

    // Log the ban
    let logChannel = guild.channels.cache.get(IDs.channels.logs.sus) as
      | TextChannel
      | undefined;

    if (logChannel === undefined) {
      logChannel = (await guild.channels.fetch(IDs.channels.logs.sus)) as
        | TextChannel
        | undefined;
      if (logChannel === undefined) {
        container.logger.error('Warn Error: Could not fetch log channel');
        info.message = `Warned ${user} but could not find the log channel. This has been logged to the database.`;
        return info;
      }
    }

    const message = new EmbedBuilder()
      .setColor('#FF6700')
      .setAuthor({
        name: `Warned ${user.tag}`,
        iconURL: `${user.displayAvatarURL()}`,
      })
      .addFields(
        { name: 'User', value: `${user}`, inline: true },
        { name: 'Moderator', value: `${mod}`, inline: true },
        { name: 'Reason', value: reason },
      )
      .setTimestamp()
      .setFooter({ text: `ID: ${userId}` });

    await logChannel.send({ embeds: [message] });

    return info;
  }
}
