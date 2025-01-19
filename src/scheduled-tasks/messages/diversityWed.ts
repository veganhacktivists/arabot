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
import { getTextBasedChannel } from '#utils/fetcher';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';

export class DiversityWedMessageTask extends ScheduledTask {
  public constructor(
    context: ScheduledTask.LoaderContext,
    options: ScheduledTask.Options,
  ) {
    super(context, {
      ...options,
      pattern: '0 15 * * 3',
    });
  }

  public async run() {
    const message =
      '**📌 Diversity Section Code of Conduct**\n\n' +
      '❤️  Be *Kind*\n' +
      '🧡  Make sure your communication invites others for discourse, not debate.\n' +
      '💛  Avoid slurs which otherize individuals or groups - safe space vibes please! <:blobheart:820513749893906543>\n' +
      '💚  When engaging in discourse, acknowledge others participating and actively ask questions in a charitable manner and avoid assumptions about what someone is saying about the topic.\n' +
      '💙  Avoid spreading misinformation.\n' +
      '💜  Be sincere when interacting with others, socially and in serious discourse.\n' +
      '❤️  Respect the creativity of others.\n' +
      '🧡  Actively seek to include others, especially moderators, in heated discourse for the purpose of de-escalation.';

    const women = await getTextBasedChannel(IDs.channels.diversity.women);
    const disabilities = await getTextBasedChannel(
      IDs.channels.diversity.disabilities,
    );

    if (!isTextBasedChannel(women) || !isTextBasedChannel(disabilities)) {
      this.container.logger.error(
        'Diversity Wednesday: The bot could not find both of the channels!',
      );

      return;
    }

    await women.send(message);
    await disabilities.send(message);
  }
}

declare module '@sapphire/plugin-scheduled-tasks' {
  interface ScheduledTasks {
    pattern: never;
  }
}
