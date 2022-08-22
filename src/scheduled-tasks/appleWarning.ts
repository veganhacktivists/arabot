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

import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import { container } from '@sapphire/framework';
import type { TextChannel } from 'discord.js';
import IDs from '../utils/ids';

class AppleWarningTask extends ScheduledTask {
  public constructor(context: ScheduledTask.Context, options: ScheduledTask.Options) {
    super(context, {
      ...options,
      cron: '0 */2 * * 2-3',
    });
  }

  public async run() {
    const { client } = container;

    const channel = client.channels.cache.get(IDs.channels.nonVegan.general) as TextChannel;

    await channel.send('Hiya everyone, this is a warning to all **Apple users**!\n'
      + 'Make sure to update your iOS, iPadOS and MacOS as there is a hack that lets anyone get remote access to your device if you click on a malicious link.\n'
      + `For more information, read the post in <#${IDs.channels.information.news}>`);
  }
}

declare module '@sapphire/plugin-scheduled-tasks' {
  interface ScheduledTasks {
    cron: never;
  }
}

export default AppleWarningTask;
