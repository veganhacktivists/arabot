// SPDX-License-Identifier: GPL-3.0-or-later
/*
    Animal Rights Advocates Discord Bot
    Copyright (C) 2022, 2025  Anthony Berg, Euphemus333

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

import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import IDs from '#utils/ids';
import { getTextBasedChannel } from '#utils/fetcher';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';

export class ActivismMonMessageTask extends ScheduledTask {
  public constructor(
    context: ScheduledTask.LoaderContext,
    options: ScheduledTask.Options,
  ) {
    super(context, {
      ...options,
      pattern: '0 15 * * 1',
    });
  }

  public async run() {
    const message =
      '**Looking for tips to meet local vegans or activism events?**\n' +
      '🔹Try searching for vegan Facebook groups for your closet major city or area.\n' +
      '🔹Get in contact with an animal rights organization like [PETA](<https://www.peta.org/>), [Direct Action Everywhere](<https://www.directactioneverywhere.com/>), [Mercy for Animals](<https://mercyforanimals.org/>), [Humane Society of the US](<https://www.humanesociety.org/>), [Vegan Outreach](<https://veganoutreach.org/>), etc in your area. Try searching for an organization promoting plant-based eating as well!\n' +
      '🔹You can also search in [Meetup](<https://www.meetup.com/home/>), a social media platform for organizing events and activities.\n' +
      '🔹Volunteering at animal sanctuaries.\n' +
      '🔹Start a Facebook or [Meetup](<https://www.meetup.com/home/>) group yourself!';

    const activism = await getTextBasedChannel(IDs.channels.activism.activism);

    if (!isTextBasedChannel(activism)) {
      this.container.logger.error(
        'Activism Monday: The bot could not find the activism channel!',
      );

      return;
    }

    await activism.send(message);
  }
}

declare module '@sapphire/plugin-scheduled-tasks' {
  interface ScheduledTasks {
    pattern: never;
  }
} 