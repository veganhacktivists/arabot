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
  VoiceState,
  CategoryChannel,
  VoiceChannel,
  TextChannel,
} from 'discord.js';
import { time, ChannelType } from 'discord.js';
import { createVerificationVoice } from '#utils/verification';
import { maxVCs, leaveBan } from '#utils/verificationConfig';
import {
  getUser,
  checkFinish,
  countIncomplete,
} from '#utils/database/verification';
import { fetchRoles } from '#utils/database/dbExistingUser';
import { fibonacci } from '#utils/maths';
import IDs from '#utils/ids';

export class VerificationLeaveVCListener extends Listener {
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
    // If the event was not a user joining the channel
    if (
      oldState.channel?.parent?.id !== IDs.categories.verification ||
      newState.channel?.parent?.id === IDs.categories.verification ||
      oldState.channel.members.size > 0
    ) {
      return;
    }

    let verifier = false;

    // Check for undefined variables
    const { channel } = oldState;
    const { guild } = newState;

    if (channel === null || guild === undefined) {
      this.container.logger.error('Verification channel not found');
      return;
    }

    // Get the category
    const categoryGuild = guild.channels.cache.get(IDs.categories.verification);
    if (categoryGuild === null) {
      this.container.logger.error('Verification channel not found');
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
      if (!(await checkFinish(channel.id)) && user !== undefined) {
        // Get roles to give back to the user
        const roles = await fetchRoles(user.id);
        roles.push(IDs.roles.verifyBlock);
        await user.roles
          .add(roles)
          .catch(() =>
            this.container.logger.error(
              'Verification: User left but bot still tried to add roles',
            ),
          );
        // Create timeout block for user
        // Counts the recent times they have incomplete verifications
        const incompleteCount =
          (await countIncomplete(user.id)) % (leaveBan + 1);
        // Creates the length of the time for the ban
        const banLength = fibonacci(incompleteCount) * 3600_000;

        await this.container.tasks.create(
          {
            name: 'verifyUnblock',
            payload: {
              userId: user.id,
              guildId: guild.id,
            },
          },
          banLength,
        );

        await user.user
          .send(
            'You have been timed out as a verifier had not joined for 15 minutes or you disconnected from verification.\n\n' +
              `You can verify again at: ${time(
                Math.round(Date.now() / 1000) + banLength / 1000,
              )}`,
          )
          .catch(() => this.container.logger.error('Verification: Closed DMs'));
      }
    }

    // Check how many voice channels there are
    const listVoiceChannels = category.children.cache.filter(
      (c) => c.type === ChannelType.GuildVoice,
    );

    // Check that it is not deleting the 'Verification' channel (in case bot crashes)
    if (channel.name !== 'Verification') {
      // Delete the channel
      await channel.delete();
    }

    // Delete text channel
    if (!verifier) {
      // Gets a list of all the text channels in the verification category
      const listTextChannels = category.children.cache.filter(
        (c) => c.type === ChannelType.GuildText,
      );
      listTextChannels.forEach((c) => {
        const textChannel = c as TextChannel;
        // Checks if the channel topic has the user's snowflake
        if (textChannel.topic !== null && textChannel.topic.includes(userSnowflake!)) {
          textChannel.delete();
        }
      });
    }

    // If there are no VCs left in verification after having the channel deleted
    if (listVoiceChannels.size - 1 === 0) {
      // Create a verification channel
      await createVerificationVoice(category);
    }

    // If there are less than 10, stop
    if (listVoiceChannels.size < maxVCs) {
      return;
    }

    const verification = listVoiceChannels.last() as VoiceChannel | undefined;

    if (verification === undefined) {
      this.container.logger.error(
        'Verification: Verification channel not found.',
      );
      return;
    }

    await verification.permissionOverwrites.edit(IDs.roles.nonvegan.nonvegan, {
      ViewChannel: true,
    });
    await verification.permissionOverwrites.edit(IDs.roles.vegan.vegan, {
      ViewChannel: true,
    });
  }
}
