// SPDX-License-Identifier: GPL-3.0-or-later
/*
    Animal Rights Advocates Discord Bot
    Copyright (C) 2022, 2025  Anthony Berg, Euphemus1

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

export class ChannelMessageCounter extends Listener {
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
    // Only count messages sent in these channels
    // The channel ID maps to what key should be incremented to
    const channels: Map<string, string> = new Map([
      [IDs.channels.nonVegan.general, 'verifyReminderMessageCounter'],
      [IDs.channels.activism.activism, 'dailyActivismMessageCounter'],
      [IDs.channels.diversity.lgbtqia, 'diversityMon:lgbtqia:messageCounter'],
      [IDs.channels.diversity.potgm, 'diversityMon:potgm:messageCounter'],
      [IDs.channels.diversity.women, 'diversityWed:women:messageCounter'],
      [
        IDs.channels.diversity.disabilities,
        'diversityWed:disabilities:messageCounter',
      ],
    ]);

    const redisKey = channels.get(message.channelId);

    // If map does not contain channel, then it will be undefined,
    // hence no need to update key
    if (redisKey === undefined) return;

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
