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
import { GuildMember } from 'discord.js';
import IDs from '#utils/ids';
import { noModHistory, userPreviouslyHadRole } from '#utils/database/memberMod';
import { getRole } from '#utils/fetcher';
import { isRole } from '#utils/typeChecking';

/**
 * Gives the trusted role to users who have levelled up to level 5
 * and has not gotten any other warnings/restrictions prior.
 */
export class TrustedListener extends Listener {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options,
  ) {
    super(context, {
      ...options,
      event: 'xpLevelUp',
    });
  }

  public async run(member: GuildMember, level: number) {
    // Checks if the member has gotten level 7
    // Has been nefred. Should take around 1.5 hours to get the trusted role now
    if (level !== 7) {
      return;
    }

    // Checks if the user has been previously moderated
    const noModerationHistory = await noModHistory(member.id);
    if (!noModerationHistory) {
      return;
    }

    const { guild } = member;
    const trusted = await getRole(IDs.roles.trusted, guild);

    if (!isRole(trusted)) {
      this.container.logger.error(
        'TrustedXP Listener: the Trusted role could not be found in the guild.',
      );
      return;
    }

    // Checks if the member has previously had the trusted role given/removed
    const previouslyHadRole = await userPreviouslyHadRole(
      member.id,
      trusted.id,
    );
    if (previouslyHadRole) {
      return;
    }

    // Checks if the user already has the trusted role
    if (member.roles.cache.has(trusted.id)) {
      return;
    }

    // Gives the trusted role to the member
    await member.roles.add(trusted);

    // Send a DM to inform the member that they have been given the trusted role
    await member.user.send(
      `Hi, you have been given the ${trusted.name} as you have been interacting in ARA for a long enough time!` +
        '\n\nThis role allows you to post attachments to the server and stream in VCs.' +
        '\nMake sure that you follow the rules, especially by **not** posting anything **NSFW**, and **no animal products or consumption of animal products**.' +
        `\n\nNot following these rules will result in the **immediate removal** of the ${trusted.name} role.`,
    );
  }
}
