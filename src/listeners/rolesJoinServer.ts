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
import type { GuildMember, Snowflake } from 'discord.js';
import { fetchRoles, getLeaveRoles } from '#utils/database/dbExistingUser';
import { blockTime } from '#utils/database/verification';
import { checkActive, getSection } from '#utils/database/restriction';
import blockedRoles from '#utils/blockedRoles';
import IDs from '#utils/ids';

export class RolesJoinServerListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'guildMemberAdd',
    });
  }

  public async run(member: GuildMember) {
    let roles: Snowflake[] = [];

    // Check if the user is restricted
    if (await checkActive(member.id)) {
      const section = await getSection(member.id);
      roles.push(IDs.roles.restrictions.restricted[section - 1]);
    } else {
      const logRoles = await getLeaveRoles(member.id);

      // Add roles if not restricted
      if (logRoles === null) {
        roles = await fetchRoles(member.id);
      } else {
        roles = logRoles.roles.filter(this.blockedRole);
      }
    }

    // Check if the user has a verification block
    const timeout = await blockTime(member.id);
    if (timeout > 0) {
      roles.push(IDs.roles.verifyBlock);
    }

    // Add roles if they don't have verification block
    if (roles.length > 0) {
      await member.roles.add(roles);
    }
  }

  private blockedRole(role: Snowflake) {
    return !blockedRoles.includes(role);
  }
}
