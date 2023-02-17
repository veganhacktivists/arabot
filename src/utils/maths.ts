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

/**
 * Checks if any parsed value is a number.
 * @param number check if variable is a number
 * @returns {boolean} true if it is a number
 */
export function isNumber(number: any) {
  return !Number.isNaN(+number);
}

/**
 * Creates a (PRNG) random integer between minimum and maximum both inclusive
 * @param min minimum integer
 * @param max maximum integer
 * @returns number a random integer between min and max
 */
export function randint(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
