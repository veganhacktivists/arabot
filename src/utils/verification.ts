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

import {
  CategoryChannel,
  ChannelType,
  GuildMember,
  PermissionsBitField,
  VoiceBasedChannel,
} from 'discord.js';
import IDs from '#utils/ids';

export async function createVerificationText(
  member: GuildMember,
  voiceChannel: VoiceBasedChannel,
  category: CategoryChannel,
  bannedName = false,
) {
  const { guild } = category;

  const channel = await guild.channels.create({
    name: `✅┃${!bannedName ? member.displayName : member.id}-verification`,
    type: ChannelType.GuildText,
    topic: `Channel for verifiers only. ${member.id} ${voiceChannel.id} (Please do not change this)`,
    parent: category.id,
    userLimit: 1,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: IDs.roles.verifyBlock,
        deny: [PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: IDs.roles.staff.verifier,
        allow: [PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: IDs.roles.staff.trialVerifier,
        allow: [PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ViewChannel],
      },
    ],
  });
  return channel;
}

export async function createVerificationVoice(
  category: CategoryChannel,
  full = false,
) {
  const { guild } = category;

  const channel = await guild.channels.create({
    name: 'Verification',
    type: ChannelType.GuildVoice,
    parent: category.id,
    userLimit: 1,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.Stream],
      },
      {
        id: IDs.roles.verifyBlock,
        deny: [PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.SendMessages],
      },
      {
        id: IDs.roles.nonvegan.nonvegan,
        allow: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: IDs.roles.vegan.vegan,
        allow: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: IDs.roles.vegan.activist,
        deny: [PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.Connect],
      },
      {
        id: IDs.roles.staff.verifier,
        allow: [PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.MuteMembers],
      },
      {
        id: IDs.roles.staff.trialVerifier,
        allow: [PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.MuteMembers],
      },
    ],
  });

  if (full) {
    await channel.permissionOverwrites.edit(IDs.roles.nonvegan.nonvegan, { Connect: false });
    await channel.permissionOverwrites.edit(IDs.roles.vegan.vegan, { Connect: false });
  }
}
