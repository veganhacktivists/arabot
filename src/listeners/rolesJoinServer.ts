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
// import { fetchRoles } from '#utils/database/dbExistingUser';
import IDs from '#utils/ids';
import { blockTime } from '#utils/database/verification';
import { checkActive, getSection } from '#utils/database/restriction';

export class RolesJoinServerListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'guildMemberAdd',
    });
  }

  public async run(member: GuildMember) {
    // Add basic roles

    const roles = [];
    // const roles = await fetchRoles(member.id);

    // Check if the user is restricted
    if (await checkActive(member.id)) {
      const section = await getSection(member.id);
      roles.length = 0;
      roles.push(IDs.roles.restrictions.restricted[section - 1]);
    }

    // Check if the user has a verification block
    const timeout = await blockTime(member.id);
    if (timeout > 0) {
      roles.push(IDs.roles.verifyBlock);
    }

    // Add roles if they don't have verification block
    await member.roles.add(roles);
  }
}
