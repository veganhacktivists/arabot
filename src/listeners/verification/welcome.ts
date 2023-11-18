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
import { ButtonStyle, ActionRowBuilder, ButtonBuilder } from 'discord.js';

import type { Client, TextChannel } from 'discord.js';
import IDs from '#utils/ids';

export class VerificationReady extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      once: true,
      event: 'ready',
    });
  }

  public async run(client: Client) {
    // Get verification category
    let welcome = client.channels.cache.get(IDs.channels.welcome) as
      | TextChannel
      | undefined;
    if (welcome === undefined) {
      welcome = (await client.channels.fetch(IDs.channels.welcome)) as
        | TextChannel
        | undefined;
      if (welcome === undefined) {
        this.container.logger.error('verifyStart: Welcome not found');
        return;
      }
    }

    const botId = this.container.client.id;
    const messages = await welcome.messages.fetch();
    const message = messages.first();

    const content =
      "**To continue and unlock more channels, please click 'Join':**" +
      '\n\n**Important:** If you want to get the vegan role, you will need to pass voice verification. ' +
      "You can do this by joining the 'Verification' voice channel after clicking the button below. " +
      "You'll chat with one of our verifiers who will just ask you a few questions before approving your Vegan role. " +
      'Vegans have access to more channels. Voice discussions may be recorded.';

    const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('welcomeJoin')
        .setLabel('Join')
        .setStyle(ButtonStyle.Success),
    );

    if (message?.author.id !== botId) {
      await welcome.send({
        content,
        components: [button],
      });
    } else if (message?.author.id === botId && message?.components.length < 1) {
      await message.delete();
      await welcome.send({
        content,
        components: [button],
      });
    }
  }
}
