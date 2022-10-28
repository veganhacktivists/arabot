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

import { Listener } from '@sapphire/framework';
import type { GuildMember } from 'discord.js';
import { checkActive, getReason } from '../utils/database/ban';

class BanJoin extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      once: true,
      event: 'guildMemberAdd',
    });
  }

  public async run(user: GuildMember) {
    // Check if the user is banned
    if (!await checkActive(user.id)) {
      return;
    }

    // Get reason from database
    const reason = await getReason(user.id);

    // Send DM for ban reason
    await user.send(`You have been banned from ARA for: ${reason}`
      + '\n\nhttps://vbcamp.org/ARA')
      .catch(() => {});

    // Ban the user
    await user.ban({ reason });
  }
}

export default BanJoin;
