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
import { container } from '@sapphire/framework';
import type { TextChannel } from 'discord.js';
import IDs from '#utils/ids';

export class VerifyReminder extends ScheduledTask {
  public constructor(context: ScheduledTask.Context, options: ScheduledTask.Options) {
    super(context, {
      ...options,
      pattern: '0 */1 * * *',
    });
  }

  public async run() {
    const { client } = container;

    // Get the total messages sent in non-vegan general since last message
    const redisKey = 'verifyReminderMessageCounter';

    const messageCount = await this.container.redis.get(redisKey);

    // Do not send if messages count is less than 100
    if (!messageCount || +messageCount < 100) return;

    // Send verification reminder to non-vegan general
    const channel = client.channels.cache.get(IDs.channels.nonVegan.general) as TextChannel;

    await channel.send('If you want to have the vegan or activist role, you\'ll need to do a voice verification. '
      + 'To do this, hop into the \'Verification\' voice channel.'
      + '\n\nIf there aren\'t any verifiers available, you\'ll be disconnected, and you can rejoin later.');

    // Reset the total message counter to 0
    await this.container.redis.set(redisKey, 0);
  }
}

declare module '@sapphire/plugin-scheduled-tasks' {
  interface VerifyReminder {
    pattern: never;
  }
}
