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

import type { TextBasedChannel } from 'discord.js';
import IDs from '#utils/ids';
import { Nullish } from '@sapphire/utilities';
import { isTextChannel } from '@sapphire/discord.js-utilities';

/**
 * Checks if the channel is in the staff category.
 * @param channel channel to check if parent is staff
 * @returns {boolean} true if is in staff channel
 */

export function checkStaff(channel: TextBasedChannel | Nullish): boolean {
  if (!isTextChannel(channel)) {
    return false;
  }

  if (channel.parent === null) {
    return false;
  }

  return (
    channel.parent.id === IDs.categories.staff ||
    channel.parent.id === IDs.categories.modMail
  );
}
