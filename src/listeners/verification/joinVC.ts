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
import type { VoiceChannel, CategoryChannel, VoiceState } from 'discord.js';
import { maxVCs } from '../../utils/verificationConfig';
import { joinVerification, startVerification } from '../../utils/database/verification';
import IDs from '../../utils/ids';

export default class VerificationJoinVCListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'voiceStateUpdate',
    });
  }

  public async run(oldState: VoiceState, newState: VoiceState) {
    // If the event was not a user joining the channel
    if (oldState.channel?.parent?.id === IDs.categories.verification
      || newState.channel?.parent?.id !== IDs.categories.verification
    ) {
      return;
    }

    // Variable if this channel is a Verifiers only VC
    let verifier = false;

    // Checks if a verifier has joined
    if (newState.channel.members.size === 2) {
      await newState.channel!.permissionOverwrites.set([
        {
          id: IDs.categories.verification,
          allow: ['SEND_MESSAGES'],
        },
      ]);
      return;
    }

    // Check if a verifier joined a verification VC and update database
    if (newState.channel.members.size === 2) {
      if (!newState.channel.name.includes(' - Verification')) {
        return;
      }

      await startVerification(newState.member!, newState.channelId!);
      return;
    }

    // Checks if there is more than one person who has joined or if the channel has members
    if (newState.channel.members.size !== 1
      || !newState.channel.members.has(newState.member!.id)) {
      return;
    }

    const channel = newState.channel!;
    const { client } = container;
    const guild = client.guilds.cache.get(newState.guild.id)!;
    const currentChannel = guild.channels.cache.get(newState.channelId!) as VoiceChannel;

    // Check if the user has the verifiers role
    if (newState.member?.roles.cache.has(IDs.roles.staff.verifier)
      || newState.member?.roles.cache.has(IDs.roles.staff.trialVerifier)) {
      await channel.setName('Verifier Meeting');
      verifier = true;
    } else {
      await channel.setName(`${newState.member?.displayName} - Verification`);
      await currentChannel.send(`Hiya ${newState.member?.user}, please be patient as a verifier has been called out to verify you.\n\nIf you leave this voice channel, you will automatically be given the non-vegan role where you gain access to this server and if you'd like to verify as a vegan again, you'd have to contact a Mod, which could be done via ModMail.`);
      // Adds to the database that the user joined verification
      await joinVerification(newState.member!, channel.id);
    }

    // Check how many voice channels there are
    const category = guild.channels.cache.get(IDs.categories.verification) as CategoryChannel;
    const listVoiceChannels = category.children.filter((c) => c.type === 'GUILD_VOICE');

    // Create a text channel for verifiers only
    // Checks if there are more than 10 voice channels
    if (!verifier) {
      const verificationText = await guild.channels.create(`✅┃${newState.member?.displayName}-verification`, {
        type: 'GUILD_TEXT',
        topic: `Channel for verifiers only. ${newState.member?.id} (Please do not change this)`,
        parent: IDs.categories.verification,
        userLimit: 1,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: IDs.roles.verifyBlock,
            deny: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
          },
          {
            id: IDs.roles.staff.verifier,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
        ],
      });

      // Send a message that someone wants to be verified
      await verificationText.send(`${newState.member?.user} wants to be verified in ${newState.channel}
      \n<@&${IDs.roles.staff.verifier}> <@&${IDs.roles.staff.trialVerifier}>`);
    }

    // Create a new channel for others to join

    // Checks if there are more than 10 voice channels
    if (listVoiceChannels.size > maxVCs - 1) {
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
            deny: ['CONNECT'],
          },
          {
            id: IDs.roles.staff.verifier,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
        ],
      });
    } else {
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

    // Change permissions to join the current channel
    await currentChannel.permissionOverwrites.set([
      {
        id: guild.roles.everyone,
        deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
      },
      {
        id: IDs.roles.verifyingAsVegan,
        deny: ['VIEW_CHANNEL'],
      },
      {
        id: newState.member!.id,
        allow: ['VIEW_CHANNEL'],
      },
    ]);
    await currentChannel.setUserLimit(0);
  }
}
