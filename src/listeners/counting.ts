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

    I developed this whilst I was on holiday in Norway for some reason
*/

import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { getLastCount, addCount } from '#utils/database/counting';
import IDs from '#utils/ids';

export class XpListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'messageCreate',
    });
  }

  public async run(message: Message) {
    if (message.channelId !== IDs.channels.misc.counting) return;

    const user = message.author;

    if (user.bot) {
      return;
    }

    let lastCount = await getLastCount();

    // If no counts exist on the database, then create the first count from the bot
    if (lastCount === null) {
      if (this.container.client.id === null) {
        message.channel.send('An unexpected error occurred trying to set up the counting channel, please contact a developer!');
        return;
      }

      const countUserId = this.container.client.id;
      const countNumber = 0;

      // Adds the bot as the first person with the count
      await addCount(countUserId, countNumber);

      lastCount = await getLastCount();
      if (lastCount === null) {
        message.channel.send('An unexpected error occurred, please contact a developer!');
        return;
      }
    }

    // Checks if it is the same user that counted since last time
    if (message.author.id === lastCount.userId) {
      return;
    }

    const regex = new RegExp(`^${lastCount.number + 1}\\b`);

    // Checks if the count was correct
    if (regex.test(message.content)) {
      await addCount(message.author.id, lastCount.number + 1);
      await message.react('✅');
      return;
    }

    // If the count was not correct, restart it
    await addCount(message.author.id, 0);
    await message.react('❌');
    await message.reply(`${message.author} counted incorrectly! The count got up to ${lastCount.number}! `
    + 'The count has been reset and the next number is 1');
  }
}
