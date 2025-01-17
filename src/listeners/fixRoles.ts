// SPDX-License-Identifier: GPL-3.0-or-later
/*
    Animal Rights Advocates Discord Bot
    Copyright (C) 2025  Anthony Berg

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

    I used the Sapphire documentation and parts of the code from the Sapphire CLI to
    create this file.
*/

import { Listener } from '@sapphire/framework';
import { DurationFormatter } from '@sapphire/time-utilities';
import { Client } from 'discord.js';
import IDs from '#utils/ids';
import { fetchRoles } from '#utils/database/dbExistingUser';
import { checkActive } from '#utils/database/moderation/restriction';
import { getUser } from '#utils/database/fun/xp';

export class FixRolesOnReady extends Listener {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options,
  ) {
    super(context, {
      ...options,
      once: true,
      event: 'ready',
      // !!!!!!!!!!!! WARNING !!!!!!!!!!!!
      // THIS SHOULD BE DISABLED BY DEFAULT
      // THIS IS ONLY USED FOR RESTORING ROLES TO THE SERVER!
      // ENABLING THIS UNINTENTIONALLY WILL CAUSE SLOWDOWNS TO THE BOT DUE TO RATE LIMITING!
      enabled: true,
    });
  }

  public async run(client: Client) {
    this.container.logger.info(
      'FixRolesOnReady: Preparation before starting to fix the roles for nonvegans...',
    );

    // Fetching the Guild
    const guild = await client.guilds.fetch(IDs.guild).catch(() => undefined);

    if (guild === undefined) {
      this.container.logger.error('FixRolesOnReady: Could not find the server');
      return;
    }

    // Fetching the channel for the logs
    // Leave the snowflake parameter empty for no logs
    const logChannel = await client.channels
      .fetch('1329152627312824320')
      .catch(() => null);
    const sendLogs = logChannel !== null;

    if (!sendLogs) {
      this.container.logger.error(
        'FixRolesOnReady: Could not find the channel for bot logs.',
      );
    } else if (sendLogs && !logChannel.isSendable()) {
      this.container.logger.info(
        'FixRolesOnReady: No permission to send in bots logs channel.',
      );
      return;
    }

    // Get all the current users
    this.container.logger.info('FixRolesOnReady: Fetching all the members...');
    if (sendLogs) {
      logChannel.send('Fetching all the users in ARA!');
    }

    const members = await guild.members.fetch().catch(() => undefined);

    if (members === undefined) {
      this.container.logger.error(
        'FixRolesOnReady: Could not fetch all the members, this function is stopping now.',
      );
      if (sendLogs) {
        logChannel.send("Never mind, something went wrong :'(");
      }
      return;
    }

    const totalMembers = members.size;

    this.container.logger.info(
      `FixRolesOnReady: Done fetching ${totalMembers} members!`,
    );

    // Giving the roles to each user
    let count = 0;
    const startTime = new Date().getTime();

    this.container.logger.info(
      'FixRolesOnReady: Starting the process of fixing the roles for every member...',
    );

    for (const [userId, member] of members) {
      // Send a message with an update for every 50 completions
      // Checks if `channelLog` has been set to null
      // The RHS of the modulo should be around 100
      if (sendLogs && count % 50 === 0) {
        const currentTime = new Date().getTime();
        const runningTime = currentTime - startTime;

        const remaining = totalMembers - count;
        // Basing this on the fact that
        const eta = remaining * (runningTime / count);
        const estimate = new DurationFormatter().format(eta);

        logChannel.send(
          `Given roles to ${count} out of ${totalMembers} members. Estimated time until completion: ${estimate}`,
        );
      }

      // Checks if the user already has vegan or non-vegan role
      if (
        member.roles.cache.has(IDs.roles.vegan.vegan) ||
        member.roles.cache.has(IDs.roles.nonvegan.nonvegan)
      ) {
        count++;
        continue;
      }

      // Checks if the user is restricted, and skips over them if they are
      const restricted = await checkActive(userId);

      if (
        restricted ||
        member.roles.cache.has(IDs.roles.restrictions.restricted1) ||
        member.roles.cache.has(IDs.roles.restrictions.restricted2) ||
        member.roles.cache.has(IDs.roles.restrictions.restrictedVegan)
      ) {
        count++;
        continue;
      }

      // Fetch the roles for the member in the database
      const dbRoles = await fetchRoles(userId);

      // Filters out the roles that the member does not have
      const roles = dbRoles.filter((role) => !member.roles.cache.has(role));

      if (!roles.includes(IDs.roles.nonvegan.nonvegan)) {
        const xp = await getUser(userId);

        if (xp !== null && xp.xp > 0) {
          roles.push(IDs.roles.nonvegan.nonvegan);
        } else {
          count++;
          continue;
        }
      }

      // Give the roles to the member
      if (roles.length > 0) {
        await member.roles.add(roles);
      }

      // Log the completion
      count += 1;
      this.container.logger.info(
        `FixRolesOnReady: Given roles to ${count}/${totalMembers}.`,
      );

      // Add a delay so that there's around 4 users processed a second
      await this.delay(5000);
    }

    // Send the logs that the fix has finished.
    const endTime = new Date().getTime();
    const totalTime = endTime - startTime;
    const totalTimeWritten = new DurationFormatter().format(totalTime);
    const finishMessage = `Finished fixing roles for all ${totalMembers} members! It took ${totalTimeWritten} to complete.`;

    this.container.logger.info(`FixRolesOnReady: ${finishMessage}`);
    if (sendLogs) {
      logChannel.send(finishMessage);
    }
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
