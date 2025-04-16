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

import { Listener } from '@sapphire/framework';
import type { VoiceChannel } from 'discord.js';
import { createVerificationVoice } from '#utils/verification';
import IDs from '#utils/ids';
import { getCategoryChannel } from '#utils/fetcher';
import {
  isCategoryChannel,
  isTextChannel,
  isVoiceChannel,
} from '@sapphire/discord.js-utilities';

export class VerificationReady extends Listener {
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

  public async run() {
    // Get verification category
    const category = await getCategoryChannel(IDs.categories.verification);

    if (!isCategoryChannel(category)) {
      this.container.logger.error('verifyStart: Channel not found');
      return;
    }

    // Check how many voice channels there are
    const voiceChannels = category.children.cache.filter((channel) =>
      isVoiceChannel(channel),
    );
    const currentVCs: VoiceChannel[] = [];
    const emptyVC: string[] = [];

    // Delete voice channels
    for (const c of voiceChannels) {
      const channel = c[1];

      if (!isVoiceChannel(channel)) {
        continue;
      }

      if (channel.members.size === 0) {
        emptyVC.push(channel.id);
        await channel.delete();
      } else {
        currentVCs.push(channel);
      }
    }

    // Delete text channels
    const textChannels = category.children.cache.filter((channel) =>
      isTextChannel(channel),
    );

    for (const c of textChannels) {
      const channel = c[1];

      if (!isTextChannel(channel)) {
        continue;
      }

      // Checks if the channel topic has the user's snowflake
      for (const snowflake in emptyVC) {
        if (channel.topic !== null && channel.topic.includes(snowflake)) {
          await channel.delete();
        }
      }
    }

    // Check if there is no voice channels, create verification
    let verification = false;

    currentVCs.forEach((channel) => {
      if (channel.name === 'Verification') {
        verification = true;
      }
    });

    if (!verification) {
      // temporarily disabling verification voice channels creation
      //await createVerificationVoice(category);
    }
  }
}
