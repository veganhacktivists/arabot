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

import { Args, Command } from '@sapphire/framework';
import type {
  User,
  Message,
  Snowflake,
  Guild,
} from 'discord.js';
import { addExistingUser, updateUser, userExists } from '#utils/database/dbExistingUser';
import { addWarn } from '#utils/database/warnings';

/*
  This command is not intended to be functional for now, this is purely to log
  warnings onto a database, so if we were to switch purely to ARA Bot, it would
  mean we would have a lot of the warns already in the database.
*/
export class WarnCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'warn',
      description: 'Warns a user (only used for logging to a database for now)',
      preconditions: [['CoordinatorOnly', 'ModOnly']],
    });
  }

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
      await message.reply('Moderator not found! Try again or contact a developer!');
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
    }

    // await message.react('✅');
  }

  private async warn(userId: Snowflake, modId: Snowflake, reason: string, guild: Guild) {
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

    // Gets guildMember
    let member = guild.members.cache.get(userId);

    if (member === undefined) {
      member = await guild.members.fetch(userId)
        .catch(() => undefined);
    }

    if (member === undefined) {
      info.message = 'User is not on this server';
      return info;
    }

    if (!(await userExists(userId))) {
      await addExistingUser(member);
    }

    await addWarn(userId, modId, reason);

    info.message = `Warned ${member}`;
    info.success = true;
    return info;
  }
}
