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

import { container } from '@sapphire/framework';
import {
  CategoryChannel,
  ChannelType,
  GuildMember,
  PermissionsBitField, Snowflake,
  TextChannel,
  time,
  User,
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

export async function getVerificationRoles(
  member: GuildMember,
  roles: {
    vegan: boolean,
    activist: boolean,
    araVegan: boolean
    trusted: boolean,
    vegCurious: boolean,
    convinced: boolean
  },
  manual: boolean = false,
) {
  const rolesAdd: Snowflake[] = [];
  if (roles.convinced) {
    rolesAdd.push(IDs.roles.nonvegan.convinced);
  }
  if (roles.vegan) {
    rolesAdd.push(IDs.roles.vegan.vegan);
    rolesAdd.push(IDs.roles.vegan.nvAccess);
  } else {
    rolesAdd.push(IDs.roles.nonvegan.nonvegan);
  }
  if (roles.activist) {
    rolesAdd.push(IDs.roles.vegan.activist);
  } else if (!manual) {
    rolesAdd.push(IDs.roles.verifyBlock);
  }
  if (roles.araVegan) {
    rolesAdd.push(IDs.roles.vegan.araVegan);
  }
  if (roles.trusted) {
    rolesAdd.push(IDs.roles.trusted);
  }
  if (roles.vegCurious) {
    rolesAdd.push(IDs.roles.nonvegan.vegCurious);
  }
  await member.roles.add(rolesAdd);
}

// Messages after verifying the user
export async function finishDM(user: User, roles: {
  vegan: boolean,
  activist: boolean,
  araVegan: boolean,
  trusted: boolean,
  vegCurious: boolean,
  convinced: boolean
}) {
  if (!roles.vegan && !roles.convinced) {
    const message = 'You\'ve been verified as non-vegan!'
      + `\n\nYou can next verify on ${time(Math.round(Date.now() / 1000) + 1814400)}`;

    await user.send(message);
  } else if (roles.convinced) {
    const message = 'You\'ve been verified as convinced!'
      + `\n\nYou can next verify on ${time(Math.round(Date.now() / 1000) + 604800)}`;

    await user.send(message);
  } else if (roles.vegan && !roles.activist) {
    const message = 'You\'ve been verified as a vegan!'
      + `\n\nYou can next get verified on ${time(Math.round(Date.now() / 1000) + 604800)} if you would wish to have the activist role.`;

    await user.send(message);
  }
}

// Messages after verifying the user
export async function finishVerifyMessages(
  user: User,
  roles: {
    vegan: boolean,
    activist: boolean,
    araVegan: boolean
    trusted: boolean,
    vegCurious: boolean,
    convinced: boolean
  },
  manual: boolean = false,
) {
  // Send a DM with when their verification is finished
  if (!manual) {
    await finishDM(user, roles)
      .catch(() => container.logger.error('Verification: Closed DMs'));
  }

  // Not vegan
  if (!roles.vegan) {
    const general = container.client.channels.cache
      .get(IDs.channels.nonVegan.general) as TextChannel | undefined;
    if (general === undefined) {
      return;
    }
    let msg = `${user}, you have been verified! Please check <#${IDs.channels.information.roles}> `
      + `and remember to follow the <#${IDs.channels.information.conduct}> and to respect ongoing discussion and debates.`;
    // Add extra info if the user got veg curious or convinced.
    if (roles.vegCurious || roles.convinced) {
      msg += `\n\nYou also have access to <#${IDs.channels.dietSupport.main}> for help on going vegan.`;
    }
    await general.send(msg);
    return;
  }

  // Vegan
  const general = container.client.channels.cache
    .get(IDs.channels.vegan.general) as TextChannel | undefined;
  if (general === undefined) {
    return;
  }
  const msg = `Welcome ${user}! Please check out <#${IDs.channels.information.roles}> :)`;
  await general.send(msg);

  // Activist role
  if (roles.activist) {
    const activistMsg = `${user} you have been given the activist role! This means that if you'd wish to engage with non-vegans in `
      + `<#${IDs.channels.nonVegan.general}>, you should follow these rules:\n\n`
      + '1. Try to move conversations with non-vegans towards veganism/animal ethics\n'
      + '2. Don\'t discuss social topics while activism is happening\n'
      + '3. Have evidence for claims you make. "I don\'t know" is an acceptable answer. Chances are someone here knows or you can take time to find out\n'
      + '4. Don\'t advocate for baby steps towards veganism. Participation in exploitation can stop today\n'
      + '5. Differences in opinion between activists should be resolved in vegan spaces, not in the chat with non-vegans';
    await user.send(activistMsg)
      .catch(() => {
        const activist = container.client.channels.cache
          .get(IDs.channels.activism.activism) as TextChannel | undefined;
        if (activist === undefined) {
          return;
        }
        activist.send(activistMsg);
      });
  }
}
