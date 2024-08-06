// SPDX-License-Identifier: GPL-3.0-or-later
/*
    Animal Rights Advocates Discord Bot
    Copyright (C) 2024  Anthony Berg

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

import { Snowflake } from 'discord.js';
import { countWarnings } from '#utils/database/moderation/warnings';
import { countRestrictions } from '#utils/database/moderation/restriction';
import { container } from '@sapphire/framework';

/**
 * Checks if the user has
 * @param userId Discord Snowflake of the user to check
 * @return Boolean true if no prior moderation action
 */
export async function noModHistory(userId: Snowflake) {
  const warnCount = await countWarnings(userId);
  const restrictCount = await countRestrictions(userId);

  return warnCount === 0 && restrictCount === 0;
}

/**
 * Checks if the user has previously had a role given or taken away by a moderator.
 * @param userId Discord Snowflake of the user to check
 * @param roleId Snowflake of the role being checked for the user
 * @return Boolean true if the user has had a moderator give/remove the specified role
 */
export async function userPreviouslyHadRole(
  userId: Snowflake,
  roleId: Snowflake,
) {
  const count = await container.database.roleLog.count({
    where: {
      userId,
      roleId,
    },
  });

  return count !== 0;
}
