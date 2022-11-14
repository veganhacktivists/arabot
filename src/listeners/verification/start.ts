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
import type {
  Client,
  CategoryChannel,
  TextChannel,
  VoiceChannel,
} from 'discord.js';
import IDs from '../../utils/ids';

class VerificationReady extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      once: true,
      event: 'ready',
    });
  }

  public async run(client: Client) {
    // Get verification category
    let category = client.channels.cache.get(IDs.categories.verification) as CategoryChannel | undefined;
    if (category === undefined) {
      category = await client.channels.fetch(IDs.categories.verification) as CategoryChannel | undefined;
      if (category === undefined) {
        console.error('verifyStart: Channel not found');
        return;
      }
    }

    // Check how many voice channels there are
    const voiceChannels = category.children.filter((c) => c.type === 'GUILD_VOICE');
    const currentVCs: VoiceChannel[] = [];
    const emptyVC: string[] = [];
    // Delete voice channels
    voiceChannels.forEach((c) => {
      const voiceChannel = c as VoiceChannel;
      if (voiceChannel.members.size === 0) {
        emptyVC.push(voiceChannel.id);
        voiceChannel.delete();
      } else {
        currentVCs.push(voiceChannel);
      }
    });

    // Delete text channels
    const textChannels = category.children.filter((c) => c.type === 'GUILD_TEXT');
    textChannels.forEach((c) => {
      const textChannel = c as TextChannel;
      // Checks if the channel topic has the user's snowflake
      emptyVC.forEach((snowflake) => {
        if (textChannel.topic!.includes(snowflake)) {
          textChannel.delete();
        }
      });
    });

    // Check if there is no voice channels, create verification
    let verification = false;
    currentVCs.forEach((c) => {
      if (c.name === 'Verification') {
        verification = true;
      }
    });
    if (!verification) {
      await category.guild.channels.create('Verification', {
        type: 'GUILD_VOICE',
        parent: IDs.categories.verification,
        userLimit: 1,
        permissionOverwrites: [
          {
            id: category.guild.roles.everyone,
            deny: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'STREAM'],
          },
          {
            id: IDs.roles.verifyBlock,
            deny: ['VIEW_CHANNEL', 'CONNECT', 'SEND_MESSAGES'],
          },
          {
            id: IDs.roles.nonvegan.nonvegan,
            allow: ['VIEW_CHANNEL'],
          },
          {
            id: IDs.roles.vegan.vegan,
            allow: ['VIEW_CHANNEL'],
          },
          {
            id: IDs.roles.vegan.activist,
            deny: ['VIEW_CHANNEL', 'CONNECT'],
          },
          {
            id: IDs.roles.staff.verifier,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'CONNECT', 'MUTE_MEMBERS'],
          },
          {
            id: IDs.roles.staff.trialVerifier,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'CONNECT', 'MUTE_MEMBERS'],
          },
        ],
      });
    }
  }
}

export default VerificationReady;
