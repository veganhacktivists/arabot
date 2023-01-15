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

import { Command, RegisterBehavior } from '@sapphire/framework';
import type { TextChannel } from 'discord.js';
import {
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
  time,
} from 'discord.js';
import IDs from '../../utils/ids';

class BanCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'private',
      description: 'Creates a private channel for a user',
      preconditions: ['CoordinatorOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) => option.setName('user')
          .setDescription('User to create a private channel with')
          .setRequired(true)),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // Get the arguments
    const user = interaction.options.getUser('user');
    const mod = interaction.member;
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (user === null || guild === null || mod === null) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    const guildMember = guild.members.cache.get(user.id);
    const modGuildMember = guild.members.cache.get(mod.user.id);

    // Checks if guildMember is null
    if (guildMember === undefined || modGuildMember === undefined) {
      await interaction.reply({
        content: 'Error fetching users!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    let name: string;
    let coordinator: string;
    if (modGuildMember.roles.cache.has(IDs.roles.staff.devCoordinator)) {
      name = 'dev';
      coordinator = IDs.roles.staff.devCoordinator;
    } else if (modGuildMember.roles.cache.has(IDs.roles.staff.modCoordinator)) {
      name = 'mod';
      coordinator = IDs.roles.staff.modCoordinator;
    } else if (modGuildMember.roles.cache.has(IDs.roles.staff.diversityCoordinator)) {
      name = 'diversity';
      coordinator = IDs.roles.staff.diversityCoordinator;
    } else if (modGuildMember.roles.cache.has(IDs.roles.staff.mentorCoordinator)) {
      name = 'mentor';
      coordinator = IDs.roles.staff.mentorCoordinator;
    } else if (modGuildMember.roles.cache.has(IDs.roles.staff.verifierCoordinator)) {
      name = 'verifier';
      coordinator = IDs.roles.staff.verifierCoordinator;
    } else if (modGuildMember.roles.cache.has(IDs.roles.staff.eventCoordinator)) {
      name = 'event';
      coordinator = IDs.roles.staff.eventCoordinator;
    } else {
      name = 'coordinator';
      coordinator = IDs.roles.staff.coordinator;
    }

    const voiceChannel = await guild.channels.create({
      name: 'Private Voice Channel',
      type: ChannelType.GuildVoice,
      parent: IDs.categories.private,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: user.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: coordinator,
          allow: [PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.MuteMembers],
        },
      ],
    });

    let privateChannel: TextChannel;
    let bannedName = false;
    try {
      privateChannel = await guild.channels.create({
        name: `🍂┃${guildMember.user.username}-private-${name}`,
        type: ChannelType.GuildText,
        topic: `Private channel. ${user.id} ${voiceChannel.id} (Please do not change this)`,
        parent: IDs.categories.private,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            allow: [PermissionsBitField.Flags.ReadMessageHistory],
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: user.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: coordinator,
            allow: [PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ViewChannel],
          },
        ],
      });
    } catch {
      privateChannel = await guild.channels.create({
        name: `🍂┃${guildMember.user.id}-private-${name}`,
        type: ChannelType.GuildText,
        topic: `Private channel. ${user.id} ${voiceChannel.id} (Please do not change this)`,
        parent: IDs.categories.private,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            allow: [PermissionsBitField.Flags.ReadMessageHistory],
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: user.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: coordinator,
            allow: [PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ViewChannel],
          },
        ],
      });
      bannedName = true;
    }

    if (!bannedName) {
      await voiceChannel.setName(`${guildMember.user.username}-private-${name}`);
    } else {
      await voiceChannel.setName(`${guildMember.user.id}-private-${name}`);
    }

    const joinTime = time(guildMember.joinedAt!);
    const registerTime = time(guildMember.user.createdAt);

    const embed = new EmbedBuilder()
      .setColor(guildMember.displayHexColor)
      .setTitle(`Private channel for ${guildMember.user.username}`)
      .setDescription(`${guildMember}`)
      .setThumbnail(guildMember.user.avatarURL()!)
      .addFields(
        { name: 'Joined:', value: `${joinTime}`, inline: true },
        { name: 'Created:', value: `${registerTime}`, inline: true },
      );

    await privateChannel.send({ embeds: [embed] });

    await interaction.reply({
      content: `Created the private channel: ${privateChannel}`,
      fetchReply: true,
      ephemeral: true,
    });
  }

  /*
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
      await message.reply('Ban reason was not provided!');
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
  }
   */
}

export default BanCommand;
