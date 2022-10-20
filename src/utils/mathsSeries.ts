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

// Created because Stove loves Fibonacci sequences
// A fibonacci sequence where n = 0 => 1
export function fibonacci(position: number) {
  let previous = 0;
  let next = 1;
  let tempNext;

  for (let i = 0; i < position; i += 1) {
    tempNext = next + previous;
    previous = next;
    next = tempNext;
  }

  return next;
}
