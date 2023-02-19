// SPDX-License-Identifier: GPL-3.0-or-later
/*
    Animal Rights Advocates Discord Bot
    Copyright (C) 2023  Anthony Berg

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

import type {
  Client,
  TextChannel,
} from 'discord.js';
import IDs from '#utils/ids';

export class NonVeganAccessReady extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      once: true,
      event: 'ready',
    });
  }

  public async run(client: Client) {
    let roles = client.channels.cache
      .get(IDs.channels.information.roles) as TextChannel | undefined;
    if (roles === undefined) {
      roles = await client.channels
        .fetch(IDs.channels.information.roles) as TextChannel | undefined;
      if (roles === undefined) {
        this.container.logger.error('nonVeganAccess: Roles not found');
        return;
      }
    }

    const botId = this.container.client.id;
    const messages = await roles.messages.fetch();
    const message = messages.first();

    const content = '**Change access to non-vegan section of the server:**\n\n'
      + 'If you\'re vegan and want your access removed/added back to the non vegan sections, '
      + 'press the button bellow to remove/gain access to the non vegan sections.';

    const button = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('nvAccess')
          .setLabel('Non Vegan Access')
          .setStyle(ButtonStyle.Primary),
      );

    if (message?.author.id !== botId) {
      await roles.send({
        content,
        components: [button],
      });
    } else if (message?.author.id === botId && message?.components.length < 1) {
      await message.delete();
      await roles.send({
        content,
        components: [button],
      });
    }
  }
}
