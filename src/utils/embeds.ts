// SPDX-License-Identifier: GPL-3.0-or-later
/*
    Animal Rights Advocates Discord Bot
    Copyright (C) 2024  Anthony Berg

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
import type { Guild, User } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import type { SusNotes } from '#utils/database/moderation/sus';
import { RestrictionLogs } from '#utils/database/moderation/restriction';
import { Warnings } from '#utils/database/moderation/warnings';

export function createSusLogEmbed(notes: SusNotes, user: User, guild: Guild) {
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`${notes.length} sus notes for ${user.username}`)
    .setThumbnail(user.displayAvatarURL());

  // Add up to 10 of the latest sus notes to the embed
  for (
    let i = notes.length > 10 ? notes.length - 10 : 0;
    i < notes.length;
    i += 1
  ) {
    // Get mod name
    let mod = notes[i].modId;
    const modMember = guild.members.cache.get(mod);
    if (modMember !== undefined) {
      mod = modMember.displayName;
    }

    // Add sus note to embed
    embed.addFields({
      name: `Sus ID: ${notes[i].id} | Moderator: ${mod} | Date: <t:${Math.floor(
        notes[i].time.getTime() / 1000,
      )}>`,
      value: notes[i].note,
    });
  }

  return embed;
}

export function createRestrictLogEmbed(
  restrictions: RestrictionLogs,
  user: User,
  guild: Guild,
) {
  const embed = new EmbedBuilder()
    .setColor('#FF6700')
    .setTitle(`${restrictions.length} restrictions for ${user.tag}`)
    .setThumbnail(user.displayAvatarURL())
    .setFooter({ text: `ID: ${user.id}` });

  // Add up to 10 of the latest restrictions to the embed
  for (
    let i = restrictions.length > 10 ? restrictions.length - 10 : 0;
    i < restrictions.length;
    i += 1
  ) {
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

    restTitle += `Date: <t:${Math.floor(
      restrictions[i].startTime.getTime() / 1000,
    )}>`;

    embed.addFields({
      name: restTitle,
      value: restrictions[i].reason,
    });
  }

  return embed;
}

export function createWarningsEmbed(
  warnings: Warnings,
  user: User,
  guild: Guild,
) {
  const embed = new EmbedBuilder()
    .setColor('#FF6700')
    .setTitle(`${warnings.length} warnings for ${user.tag}`)
    .setThumbnail(user.displayAvatarURL())
    .setFooter({ text: `ID: ${user.id}` });

  // Add up to 10 of the latest warnings to the embed
  for (
    let i = warnings.length > 10 ? warnings.length - 10 : 0;
    i < warnings.length;
    i += 1
  ) {
    // Get mod names
    let mod = warnings[i].modId;
    const modMember = guild.members.cache.get(mod);
    if (modMember !== undefined) {
      mod = modMember.displayName;
    }

    let warnTitle = `ID: ${warnings[i].id} | Moderator: ${mod} |  `;

    warnTitle += `Date: <t:${Math.floor(warnings[i].time.getTime() / 1000)}>`;

    embed.addFields({
      name: warnTitle,
      value: warnings[i].note,
    });
  }

  return embed;
}
