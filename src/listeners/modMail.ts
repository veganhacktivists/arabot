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
import { ChannelType, EmbedBuilder } from 'discord.js';
import type { GuildChannel } from 'discord.js';
import { setTimeout } from 'timers/promises';
import IDs from '#utils/ids';
import { getRestrictions } from '#utils/database/restriction';
import { findNotes } from '#utils/database/sus';

export class ModMailCreateListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'channelCreate',
    });
  }

  public async run(channel: GuildChannel) {
    // Checks if the channel is not in the ModMail category
    if (channel.parentId !== IDs.categories.modMail) return;

    // Checks if the channel is not a text channel
    if (!channel.isTextBased()) return;
    if (channel.type !== ChannelType.GuildText) return;

    // Gets the guild
    const { guild } = channel;

    // Get the channel topic
    if (channel.topic === null) return;
    const topic = channel.topic.split(' ');

    // Get the user's ID
    const userId = topic[2];

    // Check if the user is restricted on the database
    const restrictions = await getRestrictions(userId);
    if (restrictions.length === 0) return;

    // Creation of embeds
    // Restriction Logs
    const restrictEmbed = new EmbedBuilder()
      .setColor('#FF6700')
      .setTitle(`${restrictions.length} restrictions`)
      .setFooter({ text: `ID: ${userId}` });

    // Add up to 10 of the latest restrictions to the embed
    for (let i = restrictions.length > 10 ? restrictions.length - 10 : 0;
      i < restrictions.length;
      i += 1) {
      // Get mod names
      let restMod = restrictions[i].modId;
      const restModMember = guild.members.cache.get(restMod);
      if (restModMember !== undefined) {
        restMod = restModMember.displayName;
      }
      let endRestMod = restrictions[i].endModId;
      if (endRestMod !== null) {
        const endRestModMember = guild.members.cache.get(endRestMod);
        if (endRestModMember !== undefined) {
          endRestMod = endRestModMember.displayName;
        }
      }

      let restTitle = `Restriction: ${i + 1} | Restricted by: ${restMod} |  `;

      if (endRestMod !== null) {
        restTitle += `Unrestricted by: ${endRestMod} | `;
      } else {
        restTitle += 'Currently Restricted | ';
      }

      restTitle += `Date: <t:${Math.floor(restrictions[i].startTime.getTime() / 1000)}>`;

      restrictEmbed.addFields({
        name: restTitle,
        value: restrictions[i].reason,
      });
    }

    // Sus Notes
    const notes = await findNotes(userId, true);

    const susEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`${notes.length} sus notes`);

    // Add up to 10 of the latest sus notes to the embed
    for (let i = notes.length > 10 ? notes.length - 10 : 0; i < notes.length; i += 1) {
      // Get mod name
      const modGuildMember = guild.members.cache.get(notes[i].modId);
      let mod = notes[i].modId;
      if (modGuildMember !== undefined) {
        mod = modGuildMember.displayName;
      }
      // Add sus note to embed
      susEmbed.addFields({
        name: `Sus ID: ${notes[i].id} | Moderator: ${mod} | Date: <t:${Math.floor(notes[i].time.getTime() / 1000)}>`,
        value: notes[i].note,
      });
    }

    // Set a timeout for 1 second and then send the 2 embeds
    await setTimeout(1000);
    await channel.send({ embeds: [restrictEmbed, susEmbed] });
  }
}
