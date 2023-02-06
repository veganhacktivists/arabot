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
import IDs from '@utils/ids';

export class VerifyUnblock extends ScheduledTask {
  public constructor(context: ScheduledTask.Context, options: ScheduledTask.Options) {
    super(context, options);
  }

  public async run(payload: { userId: string, guildId: string }) {
    // Get the guild where the user is in
    let guild = this.container.client.guilds.cache.get(payload.guildId);
    if (guild === undefined) {
      guild = await this.container.client.guilds.fetch(payload.guildId);
      if (guild === undefined) {
        console.error('verifyUnblock: Guild not found!');
        return;
      }
    }

    // Find GuildMember for the user
    let user = guild.members.cache.get(payload.userId);
    if (user === undefined) {
      user = await guild.members.fetch(payload.userId);
      if (user === undefined) {
        console.error('verifyUnblock: GuildMember not found!');
        return;
      }
    }

    // Remove the 'verify block' role
    await user.roles.remove(IDs.roles.verifyBlock);
  }
}

declare module '@sapphire/plugin-scheduled-tasks' {
  interface ScheduledTasks {
    verifyUnblock: never;
  }
}

export default VerifyUnblock;
