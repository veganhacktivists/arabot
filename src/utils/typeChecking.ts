// SPDX-License-Identifier: GPL-3.0-or-later
/*
    Animal Rights Advocates Discord Bot
    Copyright (C) 2025  Anthony Berg

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

import { Role, User } from 'discord.js';
import { Nullish } from '@sapphire/utilities';

/**
 * Checks if a user is a `User`, and that they are not `undefined`/`null`.
 * @param user The user to check
 */
export function isUser(user: User | Nullish): user is User {
  return user instanceof User;
}

/**
 * Checks if the role is a `Role` type, and they are not `undefined`/`null`.
 * @param role the role to check
 */
export function isRole(role: Role | Nullish): role is Role {
  return role instanceof Role;
}
