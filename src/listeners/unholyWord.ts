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

import { Listener } from '@sapphire/framework';
import { GuildMember, Message } from 'discord.js';
import { Time } from '@sapphire/time-utilities';

export class UnholyWordListener extends Listener {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options,
  ) {
    super(context, {
      ...options,
      event: 'messageCreate',
    });
  }

  public async run(message: Message) {
    const content = message.content.toLowerCase();
    if (!content.includes('squart')) return;

    const member = message.member;
    if (!(member instanceof GuildMember)) return;

    await member.timeout(Time.Day * 28);

    await new Promise((f) => setTimeout(f, Time.Second * 15));

    await member.timeout(null);
    await message.reply(
      "HAHA GET PRANKED XDDDDDD!!!111 DON'T USE THAT UNHOLY WORD NEXT TIME",
    );
  }
}
