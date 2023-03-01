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

import { Args, Command, RegisterBehavior } from '@sapphire/framework';
import type {
  User,
  Message,
  Snowflake,
  TextChannel,
  Guild,
  GuildBan,
} from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import IDs from '#utils/ids';
import { removeBan, checkBan, addBan } from '#utils/database/ban';
import { checkTempBan, removeTempBan } from '#utils/database/tempBan';
import { addEmptyUser, addExistingUser, userExists } from '#utils/database/dbExistingUser';

export class UnbanCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'unban',
      description: 'Unbans a user',
      preconditions: ['RestrictedAccessOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) => option.setName('user')
          .setDescription('User to unban')
          .setRequired(true)),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // Get the arguments
    const user = interaction.options.getUser('user', true);
    const mod = interaction.member;
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (guild === null || mod === null) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    await interaction.deferReply();

    const unban = await this.unban(user.id, mod.user.id, guild);

    await interaction.editReply({ content: unban.message });
  }

  // Non Application Command method of banning a user
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

    const mod = message.member;

    if (mod === null) {
      await message.react('❌');
      await message.reply('Moderator not found! Try again or contact a developer!');
      return;
    }

    const { guild } = message;

    if (guild === null) {
      await message.react('❌');
      await message.reply('Guild not found! Try again or contact a developer!');
      return;
    }

    const unban = await this.unban(user.id, mod.user.id, guild);

    await message.reply(unban.message);
    await message.react(unban.success ? '✅' : '❌');
  }

  private async unban(userId: Snowflake, modId: Snowflake, guild: Guild) {
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
    if (!await userExists(modId)) {
      await addExistingUser(mod);
    }

    let user = guild.client.users.cache.get(userId);

    if (user === undefined) {
      user = await guild.client.users.fetch(userId);
      if (user === undefined) {
        info.message = 'Could not fetch the user!';
        return info;
      }
    }

    let dbBan = await checkBan(userId);
    const dbTempBan = await checkTempBan(userId);

    if (!dbBan && !dbTempBan) {
      let ban: GuildBan;
      try {
        ban = await guild.bans.fetch(userId);
      } catch {
        try {
          ban = await guild.bans.fetch({ user, force: true });
        } catch {
          info.message = `${user} is not banned.`;
          return info;
        }
      }
      let { reason } = ban;

      if (reason === null || reason === undefined) {
        reason = '';
      }

      // Check if user and mod are on the database
      if (!await userExists(user.id)) {
        await addEmptyUser(user.id);
      }

      // Add missing ban
      await addBan(userId, modId, `(Mod who banned is not accurate) - ${reason}`);
      dbBan = true;
    }

    // Unban the user
    await guild.members.unban(user)
      .catch(() => {});

    if (dbBan) {
      // Add unban to database
      await removeBan(user.id, mod.user.id);
    } else if (dbTempBan) {
      await removeTempBan(user.id, mod.user.id);
    }

    info.message = `${user} has been unbanned.`;
    info.success = true;

    // Log unban
    let logChannel = guild.channels.cache
      .get(IDs.channels.logs.restricted) as TextChannel | undefined;

    if (logChannel === undefined) {
      logChannel = await guild.channels
        .fetch(IDs.channels.logs.restricted) as TextChannel | undefined;
      if (logChannel === undefined) {
        this.container.logger.error('Ban Error: Could not fetch log channel');
        info.message = `${user} has been banned. This hasn't been logged in a text channel as log channel could not be found`;
        return info;
      }
    }

    const log = new EmbedBuilder()
      .setColor('#28A745')
      .setAuthor({ name: `Unbanned ${user.tag}`, iconURL: `${user.displayAvatarURL()}` })
      .addFields(
        { name: 'User', value: `${user}`, inline: true },
        { name: 'Moderator', value: `${mod}`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: `ID: ${user.id}` });

    await logChannel.send({ embeds: [log] });

    return info;
  }
}
