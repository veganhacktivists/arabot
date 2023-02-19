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

import { Command } from '@sapphire/framework';
import type { Message } from 'discord.js';
import IDs from '#utils/ids';
import { DurationFormatter } from '@sapphire/time-utilities';

export class ActivistCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'nvaccess',
      description: 'Gives the nvaccess role',
      preconditions: ['DevCoordinatorOnly'],
    });
  }

  public async messageRun(message: Message) {
    const { guild } = message;

    if (guild === null) {
      await message.reply('Guild is null');
      await message.react('❌');
      return;
    }
    await guild.members.fetch();

    const vegan = await guild.roles.cache.get(IDs.roles.vegan.vegan);

    if (vegan === undefined) {
      return;
    }

    const vegans = vegan.members.map((member) => member);
    const count = vegans.length;
    const timeout = 1500;

    await message.reply(`Starting the process now, ETA to completion: ${new DurationFormatter().format(timeout * count)}`);

    for (let i = 0; i < count; i += 1) {
      const member = vegans[i];
      setTimeout(async () => {
        await member.roles.add(IDs.roles.vegan.nvAccess);
        this.container.logger.debug(`NVAccess: Processed ${i + 1}/${count}`);
      }, timeout * i);
    }
  }
}
