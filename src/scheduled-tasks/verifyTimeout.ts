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

import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import { getGuildMember, getVoiceBasedChannel } from '#utils/fetcher';
import {
  isGuildMember,
  isVoiceBasedChannel,
} from '@sapphire/discord.js-utilities';

export class VerifyTimeout extends ScheduledTask {
  public constructor(
    context: ScheduledTask.LoaderContext,
    options: ScheduledTask.Options,
  ) {
    super(context, options);
  }

  public async run(payload: { channelId: string; userId: string }) {
    // Get the guild where the user is in
    const channel = await getVoiceBasedChannel(payload.channelId);

    if (!isVoiceBasedChannel(channel)) {
      this.container.logger.error('verifyTimeout: Channel not found!');
      return;
    }

    if (channel.members.size < 2 && channel.members.has(payload.userId)) {
      const user = await getGuildMember(payload.userId, channel.guild);

      if (!isGuildMember(user)) {
        this.container.logger.error('verifyTimeout: GuildMember not found!');
        return;
      }
      await user.voice.disconnect();
    }
  }
}

declare module '@sapphire/plugin-scheduled-tasks' {
  interface ScheduledTasks {
    verifyTimeout: { channelId: string; userId: string };
  }
}
