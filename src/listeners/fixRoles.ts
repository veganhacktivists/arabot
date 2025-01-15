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
import type { Client } from 'discord.js';
import IDs from '#utils/ids';

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
      'FixRolesOnReady: Preparation before starting to fix the roles for each user...',
    );

    // Fetching the Guild
    const guild = await client.guilds.fetch(IDs.guild).catch(() => undefined);

    if (guild === undefined) {
      this.container.logger.error('FixRolesOnReady: Could not find the server');
      return;
    }

    // Fetching the channel for the logs
    // Leave the snowflake parameter empty for no logs
    const logChannel = await client.channels.fetch('1329152627312824320');
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

    await guild.members.fetch();

    // const members = await guild.members.fetch().catch(() => undefined);
    const role = await guild.roles
      .fetch(IDs.roles.vegan.vegan)
      .catch(() => null);
    if (role === null) {
      this.container.logger.error(
        'FixRolesOnReady: Could fetch all the members, this function is stopping now.1',
      );
      if (sendLogs) {
        logChannel.send("Never mind, something went wrong :'(1");
      }
      return;
    }

    const members = role.members;
    if (members === undefined) {
      this.container.logger.error(
        'FixRolesOnReady: Could fetch all the members, this function is stopping now.',
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_, member] of members) {
      // Send a message with an update for every 50 completions
      // Checks if `channelLog` has been set to null
      // The RHS of the modulo should be around 100
      if (sendLogs && count % 100 === 0) {
        const currentTime = new Date().getTime();
        const runningTime = currentTime - startTime;

        const remaining = totalMembers - count;
        // Basing this on the fact that
        const eta = remaining * (runningTime / count);
        const estimate = new DurationFormatter().format(eta);

        logChannel.send(
          `Removed roles from ${count} out of ${totalMembers} members. Estimated time until completion: ${estimate}`,
        );
      }

      // // Checks if the user is restricted, and skips over them if they are
      // const restricted = await checkActive(userId);
      //
      // if (restricted) {
      //   continue;
      // }
      //
      // // Fetch the roles for the member in the database
      // const dbRoles = await fetchRoles(userId);
      //
      // // Filters out the roles that the member does not have
      // const roles = dbRoles.filter((role) => !member.roles.cache.has(role));
      //
      // // Give the roles to the member
      // if (roles.length > 0) {
      //   await member.roles.add(roles);
      // }

      if (
        member.roles.cache.has(IDs.roles.vegan.vegan) &&
        member.roles.cache.has(IDs.roles.nonvegan.nonvegan)
      ) {
        await member.roles.remove(IDs.roles.nonvegan.nonvegan);
      }

      // Log the completion
      count += 1;
      this.container.logger.info(
        `FixRolesOnReady: Removed roles from ${count}/${totalMembers}.`,
      );
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
}
