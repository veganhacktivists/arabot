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
import type { VoiceState, CategoryChannel, VoiceChannel } from 'discord.js';
import { maxVCs } from './config';

export class VerificationLeaveVCListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'voiceStateUpdate',
    });
  }

  public async run(oldState: VoiceState, newState: VoiceState) {
    // If the event was not a user joining the channel
    if (oldState.channel?.parent?.id !== '999431677006860409' // ID for Verification category
      || newState.channel?.parent?.id === '999431677006860409' // ID for Verification category
      || oldState.channel.members.size > 0
    ) {
      return;
    }

    // Allow more people to join VC if there are less than 10 VCs
    const { client } = container;
    const guild = client.guilds.cache.get(newState.guild.id)!;
    const user = guild.members.cache.get(oldState.member!.id)!;

    // Remove verify as vegan and give non vegan role
    await user.roles.remove('999431675081666597'); // Verify-as-vegan
    await user.roles.add('999431675081666598'); // Not vegan

    // Delete the channel
    await oldState.channel!.delete();

    // Check how many voice channels there are
    const category = guild.channels.cache.get('999431677006860409') as CategoryChannel;
    const listVoiceChannels = category.children.filter((c) => c.type === 'GUILD_VOICE');

    console.log(listVoiceChannels.size);
    // If there are less than 10, stop
    if (listVoiceChannels.size < maxVCs) {
      return;
    }

    const verification = listVoiceChannels.last() as VoiceChannel;
    console.log(verification?.name);

    await verification!.permissionOverwrites.set([
      {
        id: '999431675081666597', // verify-as-vegan
        allow: ['VIEW_CHANNEL'],
      },
    ]);
  }
}
