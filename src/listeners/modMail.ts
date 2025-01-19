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
import type { GuildChannel, EmbedBuilder } from 'discord.js';
import { setTimeout } from 'timers/promises';
import IDs from '#utils/ids';
import {
  checkActive,
  getRestrictions,
} from '#utils/database/moderation/restriction';
import { findNotes } from '#utils/database/moderation/sus';
import {
  createRestrictLogEmbed,
  createSusLogEmbed,
  createWarningsEmbed,
} from '#utils/embeds';
import { fetchWarnings } from '#utils/database/moderation/warnings';
import { isTextChannel } from '@sapphire/discord.js-utilities';
import { getUser } from '#utils/fetcher';
import { isUser } from '#utils/typeChecking';

export class ModMailCreateListener extends Listener {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options,
  ) {
    super(context, {
      ...options,
      event: 'channelCreate',
    });
  }

  public async run(channel: GuildChannel) {
    // Checks if the channel is not in the ModMail category
    if (channel.parentId !== IDs.categories.modMail) return;

    // Checks if the channel is not a text channel
    if (!isTextChannel(channel)) return;

    // Gets the guild
    const { guild } = channel;

    // Get the channel topic
    if (channel.topic === null) return;
    const topic = channel.topic.split(' ');

    // Get the user's ID
    const userId = topic[2];

    // Gets user who created ModMail
    const user = await getUser(userId);

    if (!isUser(user)) {
      return;
    }

    // Check if the user is currently restricted on the database
    if (!(await checkActive(userId))) return;

    // Get the restriction logs
    const restrictions = await getRestrictions(userId);
    if (restrictions.length === 0) return;

    // Creation of embeds
    // Restriction Logs
    const embeds: EmbedBuilder[] = [];
    embeds.push(createRestrictLogEmbed(restrictions, user, guild));

    // Warnings
    const warnings = await fetchWarnings(userId);

    embeds.push(createWarningsEmbed(warnings, user, guild));

    // Sus Notes
    const notes = await findNotes(userId, true);

    embeds.push(createSusLogEmbed(notes, user, guild));

    // Set a timeout for 1 second and then send the 2 embeds
    await setTimeout(1000);
    await channel.send({ embeds: embeds });
  }
}
