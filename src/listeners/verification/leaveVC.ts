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

import { container, Listener } from '@sapphire/framework';
import type {
  VoiceState, CategoryChannel, VoiceChannel, TextChannel,
} from 'discord.js';
import { maxVCs } from '../../utils/verificationConfig';
import { getUser } from '../../utils/database/verification';
import IDs from '../../utils/ids';

export class VerificationLeaveVCListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'voiceStateUpdate',
    });
  }

  public async run(oldState: VoiceState, newState: VoiceState) {
    // If the event was not a user joining the channel
    if (oldState.channel?.parent?.id !== IDs.categories.verification
      || newState.channel?.parent?.id === IDs.categories.verification
      || oldState.channel.members.size > 0
    ) {
      return;
    }

    // Allow more people to join VC if there are less than 10 VCs
    const { client } = container;
    const guild = client.guilds.cache.get(newState.guild.id)!;
    let verifier = false;

    // Get the user that was being verified
    const userSnowflake = await getUser(oldState.channel.id);
    if (userSnowflake === null) {
      verifier = true;
    }

    if (!verifier) {
      console.log(userSnowflake);
      const user = guild.members.cache.get(userSnowflake!)!;

      /*
      // Add the user to the database if it's not a verifier meeting
      if (!oldState.channel.name.includes(' - Verification')) {
        await finishVerification(oldState.channelId!, true, true, false, false);
      }
       */

      // Remove verify as vegan and give non vegan role
      if (!user.roles.cache.has(IDs.roles.vegan.vegan)) {
        await user.roles.remove(IDs.roles.verifyingAsVegan);
        await user.roles.add(IDs.roles.nonvegan.nonvegan);
      }
    }

    // Check how many voice channels there are
    const category = guild.channels.cache.get(IDs.categories.verification) as CategoryChannel;
    const listVoiceChannels = category.children.filter((c) => c.type === 'GUILD_VOICE');

    // Check that it is not deleting the 'Verification' channel (in case bot crashes)
    if (oldState.channel.name !== 'Verification') {
      // Delete the channel
      await oldState.channel!.delete();
    }

    // Delete text channel
    if (!verifier) {
      // Gets a list of all the text channels in the verification category
      const listTextChannels = category.children.filter((c) => c.type === 'GUILD_TEXT');
      listTextChannels.forEach((c) => {
        const textChannel = c as TextChannel;
        // Checks if the channel topic has the user's snowflake
        if (textChannel.topic!.includes(userSnowflake!)) {
          textChannel.delete();
        }
      });
    }

    // If there are no VCs left in verification after having the channel deleted
    if (listVoiceChannels.size === 0) {
      // Create a verification channel
      await guild.channels.create('Verification', {
        type: 'GUILD_VOICE',
        parent: IDs.categories.verification,
        userLimit: 1,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: IDs.roles.verifyBlock,
            deny: ['VIEW_CHANNEL', 'CONNECT', 'SEND_MESSAGES'],
          },
          {
            id: IDs.roles.verifyingAsVegan,
            allow: ['VIEW_CHANNEL'],
          },
          {
            id: IDs.roles.staff.verifier,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
        ],
      });
    }

    // If there are less than 10, stop
    if (listVoiceChannels.size < maxVCs) {
      return;
    }

    const verification = listVoiceChannels.last() as VoiceChannel;

    await verification!.permissionOverwrites.set([
      {
        id: IDs.roles.verifyingAsVegan,
        allow: ['VIEW_CHANNEL'],
      },
    ]);
  }
}
