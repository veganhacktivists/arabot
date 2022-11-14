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
  VoiceState, CategoryChannel, VoiceChannel, TextChannel,
} from 'discord.js';
import { time } from '@discordjs/builders';
import { maxVCs, leaveBan } from '../../utils/verificationConfig';
import { getUser, checkFinish, countIncomplete } from '../../utils/database/verification';
import { fetchRoles } from '../../utils/database/dbExistingUser';
import { fibonacci } from '../../utils/mathsSeries';
import IDs from '../../utils/ids';

class VerificationLeaveVCListener extends Listener {
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

    let verifier = false;

    // Check for undefined variables
    const { channel } = oldState;
    const { guild } = newState;

    if (channel === null || guild === undefined) {
      console.error('Verification channel not found');
      return;
    }

    // Get the category
    const categoryGuild = guild.channels.cache.get(IDs.categories.verification);
    if (categoryGuild === null) {
      console.error('Verification channel not found');
      return;
    }
    const category = categoryGuild as CategoryChannel;

    // Get the user that was being verified
    const userSnowflake = await getUser(channel.id);
    if (userSnowflake === null) {
      verifier = true;
    }

    // Allow more people to join VC if there are less than 10 VCs

    if (!verifier) {
      const user = guild.members.cache.get(userSnowflake!);

      // Remove verify as vegan and give non vegan role
      if (!await checkFinish(channel.id) && user !== undefined) {
        // Get roles to give back to the user
        const roles = await fetchRoles(user.id);
        roles.push(IDs.roles.verifyBlock);
        await user.roles.add(roles)
          .catch(() => console.error('Verification: User left but bot still tried to add roles'));
        // Create timeout block for user
        // Counts the recent times they have incomplete verifications
        const incompleteCount = await countIncomplete(user.id) % (leaveBan + 1);
        // Creates the length of the time for the ban
        const banLength = fibonacci(incompleteCount) * 3600_000;

        // @ts-ignore
        this.container.tasks.create('verifyUnblock', {
          userId: user.id,
          guildId: guild.id,
        }, banLength);

        await user.user.send('You have been timed out as a verifier had not joined for 15 minutes or you disconnected from verification.\n\n'
          + `You can verify again at: ${time(Math.round(Date.now() / 1000) + (banLength / 1000))}`)
          .catch(() => console.error('Verification: Closed DMs'));
      }
    }

    // Check how many voice channels there are
    const listVoiceChannels = category.children.filter((c) => c.type === 'GUILD_VOICE');

    // Check that it is not deleting the 'Verification' channel (in case bot crashes)
    if (channel.name !== 'Verification') {
      // Delete the channel
      await channel.delete();
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
    if (listVoiceChannels.size - 1 === 0) {
      // Create a verification channel
      await guild.channels.create('Verification', {
        type: 'GUILD_VOICE',
        parent: IDs.categories.verification,
        userLimit: 1,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
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

    // If there are less than 10, stop
    if (listVoiceChannels.size < maxVCs) {
      return;
    }

    const verification = listVoiceChannels.last() as VoiceChannel | undefined;

    if (verification === undefined) {
      console.error('Verification: Verification channel not found.');
      return;
    }

    await verification.permissionOverwrites.edit(IDs.roles.nonvegan.nonvegan, {
      VIEW_CHANNEL: true,
    });
    await verification.permissionOverwrites.edit(IDs.roles.vegan.vegan, {
      VIEW_CHANNEL: true,
    });
  }
}

export default VerificationLeaveVCListener;
