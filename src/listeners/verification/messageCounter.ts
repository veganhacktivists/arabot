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

import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import IDs from '#utils/ids';

export class VerificationMessageCounter extends Listener {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options,
  ) {
    super(context, {
      ...options,
      event: 'messageCreate',
    });
  }

  public async run(message: Message) {
    // Only count messages sent in non-vegan general
    if (message.channelId !== IDs.channels.nonVegan.general) return;

    const redisKey = 'verifyReminderMessageCounter';

    // Get the current count of messages sent
    const counter = await this.container.redis.get(redisKey);

    // Add 1 to the amount of messages sent
    let totalMessages = 1;

    if (counter) {
      totalMessages = +counter + 1;
    }

    // Update key to the new count
    await this.container.redis.set(redisKey, totalMessages);
  }
}
