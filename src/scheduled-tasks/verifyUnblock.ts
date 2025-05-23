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
import IDs from '#utils/ids';
import { getGuild, getGuildMember } from '#utils/fetcher';
import { isGuildMember } from '@sapphire/discord.js-utilities';

export class VerifyUnblock extends ScheduledTask {
  public constructor(
    context: ScheduledTask.LoaderContext,
    options: ScheduledTask.Options,
  ) {
    super(context, options);
  }

  public async run(payload: { userId: string; guildId: string }) {
    // Get the guild where the user is in
    const guild = await getGuild(payload.guildId);

    if (guild === undefined) {
      this.container.logger.error('verifyUnblock: Guild not found!');
      return;
    }

    // Find GuildMember for the user
    const member = await getGuildMember(payload.userId, guild);

    if (!isGuildMember(member)) {
      this.container.logger.error('verifyUnblock: GuildMember not found!');
      return;
    }

    // Remove the 'verify block' role
    await member.roles.remove(IDs.roles.verifyBlock);
  }
}

declare module '@sapphire/plugin-scheduled-tasks' {
  interface ScheduledTasks {
    verifyUnblock: { userId: string; guildId: string };
  }
}
