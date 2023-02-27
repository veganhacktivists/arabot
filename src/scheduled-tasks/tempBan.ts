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

import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import IDs from '#utils/ids';
import {
  TextChannel,
  EmbedBuilder,
} from 'discord.js';
import { checkBan } from '#utils/database/ban';
import { checkTempBan, removeTempBan } from '#utils/database/tempBan';

export class TempBan extends ScheduledTask {
  public constructor(context: ScheduledTask.Context, options: ScheduledTask.Options) {
    super(context, options);
  }

  public async run(payload: { userId: string, guildId: string }) {
    this.container.logger.debug('Temp Unban Task: Currently running unban');
    // Get the guild where the user is in
    let guild = this.container.client.guilds.cache.get(payload.guildId);
    if (guild === undefined) {
      guild = await this.container.client.guilds.fetch(payload.guildId);
      if (guild === undefined) {
        this.container.logger.error('Temp Unban Task: Guild not found!');
        return;
      }
    }

    const { userId } = payload;

    let user = guild.client.users.cache.get(userId);

    if (user === undefined) {
      user = await guild.client.users.fetch(userId);
      if (user === undefined) {
        this.container.logger.error('Temp Unban Task: Could not fetch banned user!');
        return;
      }
    }

    if (await checkBan(userId)
      || !await checkTempBan(userId)) {
      this.container.logger.debug('Temp Unban Task: User is either permanently banned or no longer temporarily banned.');
      return;
    }

    // Unban the user
    await guild.members.unban(user)
      .catch(() => {});

    await removeTempBan(userId);

    // Log unban
    let logChannel = guild.channels.cache
      .get(IDs.channels.logs.restricted) as TextChannel | undefined;

    if (logChannel === undefined) {
      logChannel = await guild.channels
        .fetch(IDs.channels.logs.restricted) as TextChannel | undefined;
      if (logChannel === undefined) {
        this.container.logger.error(`Temp Ban Listener: Could not fetch log channel. User Snowflake: ${userId}`);
        return;
      }
    }

    const log = new EmbedBuilder()
      .setColor('#28A745')
      .setAuthor({ name: `Unbanned ${user.tag} (tempban)`, iconURL: `${user.displayAvatarURL()}` })
      .addFields(
        { name: 'User', value: `${user}`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: `ID: ${user.id}` });

    await logChannel.send({ embeds: [log] });
  }
}

declare module '@sapphire/plugin-scheduled-tasks' {
  interface ScheduledTasks {
    tempBan: never;
  }
}
