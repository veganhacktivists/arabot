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

export const maxVCs = 10;

export const questionInfo = [
  {
    question: 'Welcome to Animal Rights Advocates! How did you find the server?',
    buttons: [
      'Friend',
      'YouTube',
      'Another Server',
      'Vegan Org',
    ],
  },
  {
    question: 'How long have you been vegan?',
    buttons: [
      '<1 month',
      // '1-2 months',
      '3-6 months',
      '6 months - 1 year',
      '1-2 years',
      '2+ years',
    ],
  },
  {
    question: 'Ask the user why they went vegan and to define veganism.\n'
      + 'Do they cite ethical concerns and abstinence from at least meat, dairy, eggs, leather, and fur?',
    buttons: [
      'Yes',
      'Yes with prompting',
      'No',
    ],
  },
  {
    question: 'Ask the user about their life as a vegan, including things like watching documentaries or social media content and interactions with family and friends. What are their stories like?',
    buttons: [
      'Believable',
      'Unbelievable',
      'Short',
    ],
  },
  {
    question: 'Ask the user about food and nutrition. Do they seem to know how to live as a vegan?',
    buttons: [
      'Dietitian / Chef',
      'Acceptable',
      'Salads / Smoothies',
      'No clue',
    ],
  },
];
