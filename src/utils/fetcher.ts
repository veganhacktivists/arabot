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
*/

import {
  CategoryChannel,
  Guild,
  GuildMember,
  Role,
  Snowflake,
  TextBasedChannel,
  User,
  VoiceBasedChannel,
  VoiceChannel,
} from 'discord.js';
import { isRole, isUser } from '#utils/typeChecking';
import { container } from '@sapphire/framework';
import {
  isCategoryChannel,
  isGuildMember,
  isTextBasedChannel,
  isVoiceBasedChannel,
  isVoiceChannel,
} from '@sapphire/discord.js-utilities';

/**
 * Gets a User from their Snowflake.
 * Checks the cache first, if it is not in the cache, will fetch from Discord.
 * @param userId Snowflake of the user fetch
 */
export async function getUser(userId: Snowflake): Promise<User | undefined> {
  // Attempts to get the User from the cache first
  let user = container.client.users.cache.get(userId);

  // If the user is not in the cache, fetch from Discord
  if (!isUser(user)) {
    user = await container.client.users.fetch(userId).catch(() => undefined);
  }

  return user;
}

/**
 * Gets the Guild from the Snowflake.
 * Checks if it is in the cache first, if not, attempts to fetch from Discord.
 * @param guildId the Snowflake of the Guild
 */
export async function getGuild(guildId: Snowflake): Promise<Guild | undefined> {
  // Attempts to get the GuildMember from the cache first
  let guild = container.client.guilds.cache.get(guildId);

  // If the Role is not in the cache, fetch from Discord
  if (!(guild instanceof Guild)) {
    guild = await container.client.guilds.fetch(guildId).catch(() => undefined);
  }

  return guild;
}

/**
 * Gets the GuildMember from their Snowflake.
 * Checks if it is in the cache first, if not, attempts to fetch from Discord.
 * @param memberId the Snowflake of the GuildMember
 * @param guild the Guild to get the GuildMember from
 */
export async function getGuildMember(
  memberId: Snowflake,
  guild: Guild,
): Promise<GuildMember | undefined> {
  // Attempts to get the GuildMember from the cache first
  let member = guild.members.cache.get(memberId);

  // If the GuildMember is not in the cache, fetch from Discord
  if (!isGuildMember(member)) {
    member = await guild.members.fetch(memberId).catch(() => undefined);
  }

  return member;
}

/**
 * Gets the Role from the Snowflake.
 * Checks if it is in the cache first, if not, attempts to fetch from Discord.
 * @param roleId the Snowflake of the Role
 * @param guild the Guild to get the Role from
 */
export async function getRole(
  roleId: Snowflake,
  guild: Guild,
): Promise<Role | undefined> {
  // Attempts to get the Role from the cache first
  const role = guild.roles.cache.get(roleId);

  // If the Role is not in the cache, fetch from Discord
  if (isRole(role)) {
    return role;
  }

  const fetchRole = await guild.roles.fetch(roleId).catch(() => undefined);

  if (isRole(fetchRole)) {
    return fetchRole;
  } else {
    return undefined;
  }
}

/**
 * Gets a TextBasedChannel from a Snowflake.
 * Checks if it is in the cache first, if not, attempts to fetch from Discord.
 * @param channelId the Snowflake of the TextBasedChannel
 */
export async function getTextBasedChannel(
  channelId: Snowflake,
): Promise<TextBasedChannel | undefined> {
  // Attempts to get the TextChannel from the cache first
  const channel = container.client.channels.cache.get(channelId);

  if (channel !== undefined) {
    if (channel.isTextBased()) {
      return channel;
    } else {
      return undefined;
    }
  }

  // Fetches the Channel from Discord if the channel is not found in cache
  const fetchChannel = await container.client.channels
    .fetch(channelId)
    .catch(() => undefined);

  if (isTextBasedChannel(fetchChannel)) {
    return fetchChannel;
  } else {
    return undefined;
  }
}

/**
 * Gets a CategoryChannel from a Snowflake.
 * Checks if it is in the cache first, if not, attempts to fetch from Discord.
 * @param categoryId the Snowflake of the Category
 */
export async function getCategoryChannel(
  categoryId: Snowflake,
): Promise<CategoryChannel | undefined> {
  // Attempts to get the CategoryChannel from the cache first
  const category = container.client.channels.cache.get(categoryId);

  if (category !== undefined) {
    if (isCategoryChannel(category)) {
      return category;
    } else {
      return undefined;
    }
  }

  // Fetches the Channel from Discord if the channel is not found in cache
  const fetchCategory = await container.client.channels
    .fetch(categoryId)
    .catch(() => undefined);

  if (isCategoryChannel(fetchCategory)) {
    return fetchCategory;
  } else {
    return undefined;
  }
}

/**
 * Gets a VoiceChannel from a Snowflake.
 * Checks if it is in the cache first, if not, attempts to fetch from Discord.
 * @param vcId the Snowflake of the VoiceChannel
 */
export async function getVoiceChannel(
  vcId: Snowflake,
): Promise<VoiceChannel | undefined> {
  // Attempts to get the VoiceChannel from the cache first
  const vc = container.client.channels.cache.get(vcId);

  if (vc !== undefined) {
    if (isVoiceChannel(vc)) {
      return vc;
    } else {
      return undefined;
    }
  }

  // Fetches the Channel from Discord if the channel is not found in cache
  const fetchVC = await container.client.channels
    .fetch(vcId)
    .catch(() => undefined);

  if (isVoiceChannel(fetchVC)) {
    return fetchVC;
  } else {
    return undefined;
  }
}

/**
 * Gets a VoiceBasedChannel from a Snowflake.
 * Checks if it is in the cache first, if not, attempts to fetch from Discord.
 * @param vcId the Snowflake of the VoiceBasedChannel
 */
export async function getVoiceBasedChannel(
  vcId: Snowflake,
): Promise<VoiceBasedChannel | undefined> {
  // Attempts to get the VoiceBasedChannel from the cache first
  const vc = container.client.channels.cache.get(vcId);

  if (vc !== undefined) {
    if (isVoiceBasedChannel(vc)) {
      return vc;
    } else {
      return undefined;
    }
  }

  // Fetches the Channel from Discord if the channel is not found in cache
  const fetchVC = await container.client.channels
    .fetch(vcId)
    .catch(() => undefined);

  if (isVoiceBasedChannel(fetchVC)) {
    return fetchVC;
  } else {
    return undefined;
  }
}
