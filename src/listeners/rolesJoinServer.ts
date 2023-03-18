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
  GuildMember,
  Snowflake,
  CategoryChannel,
  Guild,
  TextChannel,
} from 'discord.js';
import { ChannelType } from 'discord.js';
import { fetchRoles, getLeaveRoles } from '#utils/database/dbExistingUser';
import { blockTime } from '#utils/database/verification';
import { checkActive, getSection } from '#utils/database/restriction';
import { blockedRoles, blockedRolesAfterRestricted } from '#utils/blockedRoles';
import IDs from '#utils/ids';

export class RolesJoinServerListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'guildMemberAdd',
    });
  }

  public async run(member: GuildMember) {
    let roles: Snowflake[];
    const logRoles = await getLeaveRoles(member.id);

    // Add roles if not restricted
    if (logRoles === null) {
      roles = await fetchRoles(member.id);
    } else {
      roles = logRoles.roles.filter(this.blockedRole);
    }

    // Check if the user is restricted
    if (await checkActive(member.id)) {
      const section = await getSection(member.id);
      roles = roles.filter(this.blockedRestrictedRole);

      let includesRestricted = false;
      roles.forEach((role) => {
        for (let i = 0; i < IDs.roles.restrictions.restricted.length; i += 1) {
          if (role === IDs.roles.restrictions.restricted[i]) {
            includesRestricted = true;
          }
        }
      });

      if (!includesRestricted) {
        roles.push(IDs.roles.restrictions.restricted[section - 1]);
      }

      // Add user to the restricted vegan channel
      if (section === 5) {
        const restrictedCategory = member.guild.channels.cache.get(IDs.categories.restricted);
        if (restrictedCategory !== undefined
          && restrictedCategory.type === ChannelType.GuildCategory) {
          await this.restrictRun(member.id, restrictedCategory, member.guild);
        }
      }
    }

    // Check if the user has a verification block
    const timeout = await blockTime(member.id);
    if (timeout > 0) {
      roles.push(IDs.roles.verifyBlock);
    } else if (roles.includes(IDs.roles.verifyBlock)) {
      const pos = roles.indexOf(IDs.roles.verifyBlock);
      roles.splice(pos, pos);
    }

    // Add roles if they don't have verification block
    if (roles.length > 0) {
      await member.roles.add(roles);
    }

    const privateCategory = member.guild.channels.cache.get(IDs.categories.private);

    if (privateCategory !== undefined
      && privateCategory.type === ChannelType.GuildCategory) {
      await this.privateRun(member.id, privateCategory, member.guild);
    }

    // TODO add access back to diversity team
  }

  private async restrictRun(userId: Snowflake, category: CategoryChannel, guild: Guild) {
    const textChannels = category.children.cache
      .filter((c) => c.type === ChannelType.GuildText);
    textChannels.forEach((c) => {
      const textChannel = c as TextChannel;
      // Checks if the channel topic has the user's snowflake
      if (textChannel.topic?.includes(userId)) {
        const topic = textChannel.topic.split(' ');
        const vcId = topic[topic.indexOf(userId) + 1];
        const voiceChannel = guild.channels.cache.get(vcId);

        if (voiceChannel !== undefined
          && voiceChannel.parentId === IDs.categories.restricted
          && voiceChannel.isVoiceBased()) {
          voiceChannel.permissionOverwrites.edit(userId, { ViewChannel: true });
        }
        textChannel.permissionOverwrites.edit(userId, { ViewChannel: true });
      }
    });
  }

  private async privateRun(userId: Snowflake, category: CategoryChannel, guild: Guild) {
    const textChannels = category.children.cache
      .filter((c) => c.type === ChannelType.GuildText);
    textChannels.forEach((c) => {
      const textChannel = c as TextChannel;
      // Checks if the channel topic has the user's snowflake
      if (textChannel.topic?.includes(userId)) {
        const topic = textChannel.topic.split(' ');
        const vcId = topic[topic.indexOf(userId) + 2];
        const voiceChannel = guild.channels.cache.get(vcId);

        if (voiceChannel !== undefined
          && voiceChannel.parentId === IDs.categories.private
          && voiceChannel.isVoiceBased()) {
          voiceChannel.permissionOverwrites.edit(userId, { ViewChannel: true });
        }
        textChannel.permissionOverwrites.edit(userId, { ViewChannel: true });
      }
    });
  }

  private blockedRole(role: Snowflake) {
    return !blockedRoles.includes(role);
  }

  private blockedRestrictedRole(role: Snowflake) {
    return !blockedRolesAfterRestricted.includes(role);
  }
}
