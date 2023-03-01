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

import {
  Args,
  Command,
  RegisterBehavior,
  container,
} from '@sapphire/framework';
import {
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
  time,
} from 'discord.js';
import type {
  User,
  Message,
  TextChannel,
  Guild,
  Snowflake,
} from 'discord.js';
import IDs from '#utils/ids';
import {
  addEmptyUser,
  updateUser,
  userExists,
  fetchRoles,
} from '#utils/database/dbExistingUser';
import { restrict, checkActive } from '#utils/database/restriction';
import { randint } from '#utils/maths';

export async function restrictRun(
  userId: Snowflake,
  modId: Snowflake,
  reason: string,
  guild: Guild,
  tolerance = false,
) {
  const info = {
    message: '',
    success: false,
  };

  let user = guild.client.users.cache.get(userId);

  if (user === undefined) {
    user = await guild.client.users.fetch(userId);
    if (user === undefined) {
      info.message = 'Error fetching user';
      return info;
    }
  }

  // Gets mod's GuildMember
  const mod = guild.members.cache.get(modId);

  // Checks if guildMember is null
  if (mod === undefined) {
    info.message = 'Error fetching mod';
    return info;
  }

  // Check if mod is in database
  await updateUser(mod);

  if (await checkActive(userId)) {
    info.message = `<@${userId}> is already restricted!`;
    return info;
  }

  // Gets guildMember
  let member = guild.members.cache.get(userId);

  if (member === undefined) {
    member = await guild.members.fetch(userId)
      .catch(() => undefined);
  }

  const restrictRoles = IDs.roles.restrictions.restricted;

  let section = tolerance ? randint(3, 4) : randint(1, 2);

  if (member !== undefined) {
    // Checks if the user is not restricted
    if (member.roles.cache.hasAny(...restrictRoles)) {
      info.message = `${member} is already restricted!`;
      return info;
    }

    // Check if user and mod are on the database
    await updateUser(member);

    if (member.roles.cache.has(IDs.roles.vegan.vegan)) {
      section = 5;
    }

    await member.roles.add(restrictRoles[section - 1]);

    if (member.roles.cache.has(IDs.roles.vegan.vegan)) {
      const voiceChannel = await guild.channels.create({
        name: 'Restricted Voice Channel',
        type: ChannelType.GuildVoice,
        parent: IDs.categories.restricted,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: member.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: IDs.roles.staff.restricted,
            allow: [PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.Connect,
              PermissionsBitField.Flags.MuteMembers],
          },
        ],
      });

      let restrictedChannel: TextChannel;
      let bannedName = false;
      try {
        restrictedChannel = await guild.channels.create({
          name: `⛔┃${member.user.username}-restricted`,
          type: ChannelType.GuildText,
          topic: `Restricted channel. ${member.id} ${voiceChannel.id} (Please do not change this)`,
          parent: IDs.categories.restricted,
          permissionOverwrites: [
            {
              id: guild.roles.everyone,
              allow: [PermissionsBitField.Flags.ReadMessageHistory],
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: member.id,
              allow: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: IDs.roles.staff.restricted,
              allow: [PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ViewChannel],
            },
          ],
        });
      } catch {
        restrictedChannel = await guild.channels.create({
          name: `⛔┃${member.user.id}-restricted`,
          type: ChannelType.GuildText,
          topic: `Restricted channel. ${member.id} ${voiceChannel.id} (Please do not change this)`,
          parent: IDs.categories.restricted,
          permissionOverwrites: [
            {
              id: guild.roles.everyone,
              allow: [PermissionsBitField.Flags.ReadMessageHistory],
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: member.id,
              allow: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: IDs.roles.staff.restricted,
              allow: [PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ViewChannel],
            },
          ],
        });
        bannedName = true;
      }

      if (!bannedName) {
        await voiceChannel.setName(`${member.user.username}-restricted`);
      } else {
        await voiceChannel.setName(`${member.user.id}-restricted`);
      }

      const joinTime = time(member.joinedAt!);
      const registerTime = time(member.user.createdAt);

      const embed = new EmbedBuilder()
        .setColor(member.displayHexColor)
        .setTitle(`Restricted channel for ${member.user.username}`)
        .setDescription(`${member}`)
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
          { name: 'Joined:', value: `${joinTime}`, inline: true },
          { name: 'Created:', value: `${registerTime}`, inline: true },
        );

      await restrictedChannel.send({ embeds: [embed] });
    }

    await member.roles.remove([
      IDs.roles.vegan.vegan,
      IDs.roles.vegan.plus,
      IDs.roles.vegan.activist,
      IDs.roles.vegan.nvAccess,
      IDs.roles.trusted,
      IDs.roles.nonvegan.nonvegan,
      IDs.roles.nonvegan.convinced,
      IDs.roles.nonvegan.vegCurious,
    ]);
  } else if (!await userExists(userId)) {
    await addEmptyUser(userId);
  } else {
    const dbRoles = await fetchRoles(userId);
    if (dbRoles.includes(IDs.roles.vegan.vegan)) {
      section = 5;
    }
  }

  // Restrict the user on the database
  await restrict(userId, modId, reason, section);

  info.message = `Restricted ${user}`;
  info.success = true;

  // DM the reason

  const dmEmbed = new EmbedBuilder()
    .setColor('#FF6700')
    .setAuthor({ name: 'You\'ve been restricted!', iconURL: `${user.displayAvatarURL()}` })
    .addFields(
      { name: 'Reason', value: reason },
    )
    .setTimestamp();

  await user.send({ embeds: [dmEmbed] })
    .catch(() => {});

  // Log the ban
  let logChannel = guild.channels.cache
    .get(IDs.channels.logs.restricted) as TextChannel | undefined;

  if (logChannel === undefined) {
    logChannel = await guild.channels
      .fetch(IDs.channels.logs.restricted) as TextChannel | undefined;
    if (logChannel === undefined) {
      container.logger.error('Restrict Error: Could not fetch log channel');
      info.message = `Restricted ${user} but could not find the log channel. This has been logged to the database.`;
      return info;
    }
  }

  const message = new EmbedBuilder()
    .setColor('#FF6700')
    .setAuthor({ name: `Restricted ${user.tag}`, iconURL: `${user.displayAvatarURL()}` })
    .addFields(
      { name: 'User', value: `${user}`, inline: true },
      { name: 'Moderator', value: `${mod}`, inline: true },
      { name: 'Reason', value: reason },
    )
    .setTimestamp()
    .setFooter({ text: `ID: ${userId}` });

  await logChannel.send({ embeds: [message] });

  return info;
}

export class RestrictCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'restrict',
      aliases: ['r', 'rest', 'rr', 'rv'],
      description: 'Restricts a user',
      preconditions: ['ModOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) => option.setName('user')
          .setDescription('User to restrict')
          .setRequired(true))
        .addStringOption((option) => option.setName('reason')
          .setDescription('Reason for restricting the user')
          .setRequired(true)),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // Get the arguments
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    const mod = interaction.member;
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (guild === null || mod === null) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    await interaction.deferReply();

    const info = await restrictRun(user?.id, mod.user.id, reason, guild);

    await interaction.editReply({
      content: info.message,
    });
  }

  // Non Application Command method of banning a user
  public async messageRun(message: Message, args: Args) {
    // Get arguments
    let user: User;
    try {
      user = await args.pick('user');
    } catch {
      await message.react('❌');
      await message.reply('User was not provided!');
      return;
    }
    const reason = args.finished ? null : await args.rest('string');
    const mod = message.member;

    if (reason === null) {
      await message.react('❌');
      await message.reply('Restrict reason was not provided!');
      return;
    }

    if (mod === null) {
      await message.react('❌');
      await message.reply('Moderator not found! Try again or contact a developer!');
      return;
    }

    const { guild } = message;

    if (guild === null) {
      await message.react('❌');
      await message.reply('Guild not found! Try again or contact a developer!');
      return;
    }

    const info = await restrictRun(user?.id, mod.user.id, reason, guild);

    await message.reply(info.message);
    await message.react(info.success ? '✅' : '❌');
  }
}
