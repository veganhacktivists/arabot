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

    I used the Sapphire documentation and parts of the code from the Sapphire CLI to
    create this file.
*/

import { Listener } from '@sapphire/framework';
import type { Client } from 'discord.js';
import IDs from '#utils/ids';
import { getTextBasedChannel } from '#utils/fetcher';
import { isTextBasedChannel } from '@sapphire/discord.js-utilities';

export class ReadyListener extends Listener {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options,
  ) {
    super(context, {
      ...options,
      once: true,
      event: 'ready',
    });
  }

  public async run(client: Client) {
    const { username, id } = client.user!;
    this.container.logger.info(`Successfully logged in as ${username} (${id})`);

    const botLogChannel = await getTextBasedChannel(IDs.channels.logs.bot);

    if (!isTextBasedChannel(botLogChannel)) {
      this.container.logger.error(
        'ReadyListener: Could not find the channel for bot logs.',
      );
      return;
    } else if (!botLogChannel.isSendable()) {
      this.container.logger.info(
        'ReadyListener: No permission to send in bots logs channel.',
      );
      return;
    }

    botLogChannel.send('The bot has started up!');
  }
}
