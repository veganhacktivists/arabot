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

import IDs from '#utils/ids';

export const blockedRoles = [
  IDs.roles.staff.verifierCoordinator,
  IDs.roles.staff.mentorCoordinator,
  IDs.roles.staff.restricted,
  IDs.roles.staff.moderator,
  IDs.roles.staff.trialModerator,
  IDs.roles.staff.verifier,
  IDs.roles.staff.trialVerifier,
  IDs.roles.staff.mentor,
  IDs.roles.stageHost,
];

export const blockedRolesAfterRestricted = [
  IDs.roles.vegan.vegan,
  IDs.roles.vegan.plus,
  IDs.roles.vegan.activist,
  IDs.roles.vegan.nvAccess,
  IDs.roles.trusted,
  IDs.roles.nonvegan.nonvegan,
  IDs.roles.nonvegan.convinced,
  IDs.roles.nonvegan.vegCurious,
];
