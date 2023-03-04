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
import { addXp, checkCanAddXp } from '#utils/database/xp';
import { randint } from '#utils/maths';

export class XpListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'messageCreate',
    });
  }

  public async run(message: Message) {
    const user = message.author;

    if (user.bot) {
      return;
    }

    if (!await checkCanAddXp(user.id)) {
      return;
    }

    const xp = randint(15, 25);

    await addXp(user.id, xp);
  }
}
