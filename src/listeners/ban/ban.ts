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
import type { GuildBan } from 'discord.js';
import { AuditLogEvent, EmbedBuilder, TextChannel } from 'discord.js';
import { addBan, checkBan } from '#utils/database/ban';
import IDs from '#utils/ids';
import { addEmptyUser, addExistingUser } from '#utils/database/dbExistingUser';

export class BanListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'guildBanAdd',
    });
  }

  public async run(ban: GuildBan) {
    if (await checkBan(ban.user.id)) {
      return;
    }

    // Get the audit logs for the ban
    const logs = await ban.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberBanAdd,
    });

    const banLog = logs.entries.first();

    if (banLog === undefined) {
      this.container.logger.error('BanListener: banLog is undefined.');
      return;
    }

    const { executor, target } = banLog;

    if (ban.user !== target) {
      this.container.logger.error('BanListener: ban.user !== target.');
      return;
    }

    if (executor === null) {
      this.container.logger.error('BanListener: mod not found.');
      return;
    }

    if (this.container.client.user === null) {
      this.container.logger.error('BanListener: client.user is null.');
      return;
    }

    // Check if the bot banned the user
    if (executor.id === this.container.client.user.id) {
      this.container.logger.error('BanListener: got past the checkActive and bot banned this user.');
      return;
    }

    const { user } = ban;
    const { guild } = ban;

    // Gets mod's GuildMember
    let mod = guild.members.cache.get(executor.id);

    // Checks if GuildMember is null
    if (mod === undefined) {
      mod = await guild.members.fetch(executor.id)
        .catch(() => undefined);
      if (mod === undefined) {
        this.container.logger.error('UnbanListener: Could not fetch moderator.');
        return;
      }
    }

    // Check if mod is in database
    await addExistingUser(mod);

    if (await checkBan(user.id)) {
      this.container.logger.error('BanListener: got past the checkActive at the start.');
      return;
    }

    // Check if user and mod are on the database
    await addEmptyUser(user.id);

    let { reason } = banLog;

    if (reason === null) {
      reason = 'Was banned without using the bot, reason was not given';
    }

    // Add missing ban
    await addBan(user.id, mod.id, `${reason}`);

    // Log the ban
    let logChannel = guild.channels.cache
      .get(IDs.channels.logs.restricted) as TextChannel | undefined;

    if (logChannel === undefined) {
      logChannel = await guild.channels
        .fetch(IDs.channels.logs.restricted) as TextChannel | undefined;
      if (logChannel === undefined) {
        this.container.logger.error('BanListener: Could not fetch log channel');
        return;
      }
    }

    const log = new EmbedBuilder()
      .setColor('#FF0000')
      .setAuthor({ name: `Banned ${user.tag} (not done via bot)`, iconURL: `${user.displayAvatarURL()}` })
      .addFields(
        { name: 'User', value: `${user}`, inline: true },
        { name: 'Moderator', value: `${mod}`, inline: true },
        { name: 'Reason', value: reason },
      )
      .setTimestamp()
      .setFooter({ text: `ID: ${user.id}` });

    await logChannel.send({ embeds: [log] });
  }
}
