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
import type { VoiceState } from 'discord.js';
import { checkActive, removeMute } from '#utils/database/moderation/vcMute';

export class VCMuteListener extends Listener {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options,
  ) {
    super(context, {
      ...options,
      event: 'voiceStateUpdate',
    });
  }

  public async run(oldState: VoiceState, newState: VoiceState) {
    // Check the user joining the channel if they need to be muted
    if (oldState.channel === null && newState.channel !== null) {
      const { member } = newState;

      if (member === null) {
        this.container.logger.error(
          'VCMute Listener - GuildMember not found when joining',
        );
        return;
      }

      // Check if user is already muted
      if (member.voice.serverMute) {
        return;
      }

      // Check if user is muted on the database
      if (!(await checkActive(member.id))) {
        return;
      }

      // Server mute the user
      await member.voice.setMute(true);
      return;
    }

    // Check if the user has been unmuted by a mod
    if (oldState.channel !== null && newState.channel !== null) {
      const { member } = newState;

      if (member === null) {
        this.container.logger.error(
          'VCMute Listener - GuildMember not found when unmuting',
        );
        return;
      }

      // Check if user is muted on the database
      if (!(await checkActive(member.id))) {
        return;
      }

      // Checks if the user has been unmuted
      if (oldState.serverMute && !newState.serverMute) {
        await removeMute(member.id);
      }
    }
  }
}
