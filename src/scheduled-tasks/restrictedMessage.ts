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
import IDs from '#utils/ids';

export class RestrictedMessageTask extends ScheduledTask {
  public constructor(context: ScheduledTask.Context, options: ScheduledTask.Options) {
    super(context, {
      ...options,
      cron: '0 17 * * *',
    });
  }

  public async run() {
    const { client } = container;

    const restricted = client.channels.cache.get(IDs.channels.restricted.restricted) as TextChannel;
    const tolerance = client.channels.cache.get(IDs.channels.restricted.tolerance) as TextChannel;

    await restricted.send(this.message(IDs.roles.restrictions.restricted1));
    await tolerance.send(this.message(IDs.roles.restrictions.restricted3));
  }

  private message(id: string) {
    return `Hi <@&${id}>, just a friendly reminder that you can reach out to <@575252669443211264> `
      + 'to attempt to clear up the issue that lead to your restriction and rejoin the server.'
      + '\n\nJust let us know what got you restricted and why you’d like to avoid repeating that behaviour and we’ll try to sort it out.';
  }
}

declare module '@sapphire/plugin-scheduled-tasks' {
  interface ScheduledTasks {
    cron: never;
  }
}
