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
import { EmbedBuilder } from 'discord.js';
import { checkBan } from '#utils/database/moderation/ban';
import {
  checkTempBan,
  removeTempBan,
} from '#utils/database/moderation/tempBan';
import { getGuild, getTextBasedChannel, getUser } from '#utils/fetcher';
import { isUser } from '#utils/typeChecking';
import { isTextChannel } from '@sapphire/discord.js-utilities';

export class TempBan extends ScheduledTask {
  public constructor(
    context: ScheduledTask.LoaderContext,
    options: ScheduledTask.Options,
  ) {
    super(context, options);
  }

  public async run(payload: { userId: string; guildId: string }) {
    this.container.logger.debug('Temp Unban Task: Currently running unban');

    // Get the guild where the user is in
    const guild = await getGuild(payload.guildId);

    if (guild === undefined) {
      this.container.logger.error('Temp Unban Task: Guild not found!');
      return;
    }

    const { userId } = payload;

    const user = await getUser(userId);

    if (!isUser(user)) {
      this.container.logger.error(
        'Temp Unban Task: Could not fetch banned user!',
      );
      return;
    }

    if ((await checkBan(userId)) || !(await checkTempBan(userId))) {
      this.container.logger.debug(
        'Temp Unban Task: User is either permanently banned or no longer temporarily banned.',
      );
      return;
    }

    // Unban the user
    await guild.members.unban(user).catch(() => {});

    await removeTempBan(userId);

    // Log unban
    const logChannel = await getTextBasedChannel(IDs.channels.logs.restricted);

    if (!isTextChannel(logChannel)) {
      this.container.logger.error(
        `Temp Ban Listener: Could not fetch log channel. User Snowflake: ${userId}`,
      );
      return;
    }

    const log = new EmbedBuilder()
      .setColor('#28A745')
      .setAuthor({
        name: `Unbanned ${user.tag} (tempban)`,
        iconURL: `${user.displayAvatarURL()}`,
      })
      .addFields({ name: 'User', value: `${user}`, inline: true })
      .setTimestamp()
      .setFooter({ text: `ID: ${user.id}` });

    await logChannel.send({ embeds: [log] });
  }
}

declare module '@sapphire/plugin-scheduled-tasks' {
  interface ScheduledTasks {
    tempBan: { userId: string; guildId: string };
  }
}
