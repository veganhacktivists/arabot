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

import { RegisterBehavior } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { TextChannel, Snowflake, MessageFlagsBitField } from 'discord.js';
import {
  ChannelType,
  EmbedBuilder,
  GuildMember,
  PermissionsBitField,
  time,
} from 'discord.js';
import IDs from '#utils/ids';
import {
  isCategoryChannel,
  isGuildBasedChannel,
  isGuildMember,
  isTextChannel,
  isVoiceChannel,
} from '@sapphire/discord.js-utilities';
import {
  getCategoryChannel,
  getGuildMember,
  getVoiceChannel,
} from '#utils/fetcher';
import { isUser } from '#utils/typeChecking';

export class PrivateCommand extends Subcommand {
  public constructor(
    context: Subcommand.LoaderContext,
    options: Subcommand.Options,
  ) {
    super(context, {
      ...options,
      name: 'private',
      subcommands: [
        {
          name: 'create',
          chatInputRun: 'create',
        },
        {
          name: 'delete',
          chatInputRun: 'delete',
        },
      ],
      description: 'Creates/deletes private channels for a user',
      preconditions: ['CoordinatorOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addSubcommand((command) =>
            command
              .setName('create')
              .setDescription('Create a private channel')
              .addUserOption((option) =>
                option
                  .setName('user')
                  .setDescription('User to create a private channel with')
                  .setRequired(true),
              ),
          )
          .addSubcommand((command) =>
            command
              .setName('delete')
              .setDescription('Delete a private channel')
              .addUserOption((option) =>
                option
                  .setName('user')
                  .setDescription('User to delete a private channel from'),
              ),
          ),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  public async create(interaction: Subcommand.ChatInputCommandInteraction) {
    // Get the arguments
    const user = interaction.options.getUser('user', true);
    const modUser = interaction.user;
    const { guild } = interaction;

    await interaction.deferReply({
      flags: MessageFlagsBitField.Flags.Ephemeral,
    });

    // Checks if all the variables are of the right type
    if (guild === null) {
      await interaction.editReply({
        content: 'Error fetching mod!',
      });
      return;
    }

    const member = await getGuildMember(user.id, guild);
    const mod = await getGuildMember(modUser.id, guild);

    // Checks if guildMember is null
    if (!isGuildMember(member) || !isGuildMember(mod)) {
      await interaction.editReply({
        content: 'Error fetching users!',
      });
      return;
    }

    const [name, coordinator] = this.getCoordinator(mod);

    if (await this.checkPrivate(member.id, coordinator)) {
      await interaction.editReply({
        content: 'A private channel already exists!',
      });
      return;
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
          allow: [
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.MuteMembers,
          ],
        },
      ],
    });

    let privateChannel: TextChannel;
    let bannedName = false;
    try {
      privateChannel = await guild.channels.create({
        name: `🍂┃${member.user.username}-private-${name}`,
        type: ChannelType.GuildText,
        topic: `Private channel. ${user.id} ${coordinator} ${voiceChannel.id} (Please do not change this)`,
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
            allow: [
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ViewChannel,
            ],
          },
        ],
      });
    } catch {
      privateChannel = await guild.channels.create({
        name: `🍂┃${member.user.id}-private-${name}`,
        type: ChannelType.GuildText,
        topic: `Private channel. ${user.id} ${coordinator} ${voiceChannel.id} (Please do not change this)`,
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
            allow: [
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ViewChannel,
            ],
          },
        ],
      });
      bannedName = true;
    }

    if (!bannedName) {
      await voiceChannel.setName(`${member.user.username}-private-${name}`);
    } else {
      await voiceChannel.setName(`${member.user.id}-private-${name}`);
    }

    const joinTime = time(member.joinedAt!);
    const registerTime = time(member.user.createdAt);

    const embed = new EmbedBuilder()
      .setColor(member.displayHexColor)
      .setTitle(`Private channel for ${member.user.username}`)
      .setDescription(`${member}`)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: 'Joined:', value: `${joinTime}`, inline: true },
        { name: 'Created:', value: `${registerTime}`, inline: true },
      );

    await privateChannel.send({ embeds: [embed] });

    await interaction.editReply({
      content: `Created the private channel: ${privateChannel}`,
    });
  }

  public async delete(interaction: Subcommand.ChatInputCommandInteraction) {
    // Get the arguments
    const user = interaction.options.getUser('user');
    const modUser = interaction.user;
    const { guild, channel } = interaction;

    await interaction.deferReply({
      flags: MessageFlagsBitField.Flags.Ephemeral,
    });

    // Checks if all the variables are of the right type
    if (guild === null || !isGuildBasedChannel(channel)) {
      await interaction.editReply({
        content: 'Error fetching user!',
      });
      return;
    }

    const mod = await getGuildMember(modUser.id, guild);

    // Checks if guildMember is null
    if (!isGuildMember(mod)) {
      await interaction.editReply({
        content: 'Error fetching users!',
      });
      return;
    }

    const coordinatorInfo = this.getCoordinator(mod);
    const coordinator = coordinatorInfo[1];
    let topic: string[];

    if (!isUser(user)) {
      if (!isTextChannel(channel)) {
        await interaction.editReply({
          content:
            'Please make sure you ran this command in the original private text channel!',
        });
        return;
      }

      if (channel.parentId !== IDs.categories.private) {
        await interaction.editReply({
          content:
            'Please make sure you ran this command in the original private text channel!',
        });
        return;
      }

      if (channel.topic === null) {
        await interaction.editReply({
          content: "There was an error with this channel's topic!",
        });
        return;
      }

      topic = channel.topic.split(' ');
      await channel.delete();

      const vcId = topic[topic.indexOf(coordinator) + 1];
      const voiceChannel = await getVoiceChannel(vcId);

      if (
        isVoiceChannel(voiceChannel) &&
        voiceChannel.parentId === IDs.categories.private
      ) {
        await voiceChannel.delete();
      }

      return;
    }
    const category = await getCategoryChannel(IDs.categories.private);

    if (category === undefined) {
      await interaction.editReply({
        content: 'Could not find category!',
      });
      return;
    }

    const textChannels = category.children.cache.filter((channel) =>
      isTextChannel(channel),
    );

    for (const c of textChannels) {
      const channel = c[1];

      if (!isTextChannel(channel)) {
        continue;
      }

      // Checks if the channel topic has the user's snowflake
      if (channel.topic !== null && channel.topic.includes(user.id)) {
        topic = channel.topic.split(' ');
        const vcId = topic[topic.indexOf(coordinator) + 1];
        const voiceChannel = await getVoiceChannel(vcId);

        if (
          isVoiceChannel(voiceChannel) &&
          voiceChannel.parentId === IDs.categories.private
        ) {
          await voiceChannel.delete();
        }
        await channel.delete();
      }
    }

    await interaction.editReply({
      content: `Successfully deleted the channel for ${user}`,
    });
  }

  private getCoordinator(user: GuildMember) {
    let name: string;
    let id: string;
    if (user.roles.cache.has(IDs.roles.staff.devCoordinator)) {
      name = 'dev';
      id = IDs.roles.staff.devCoordinator;
    } else if (user.roles.cache.has(IDs.roles.staff.modCoordinator)) {
      name = 'mod';
      id = IDs.roles.staff.modCoordinator;
    } else if (user.roles.cache.has(IDs.roles.staff.diversityCoordinator)) {
      name = 'diversity';
      id = IDs.roles.staff.diversityCoordinator;
    } else if (user.roles.cache.has(IDs.roles.staff.mentorCoordinator)) {
      name = 'mentor';
      id = IDs.roles.staff.mentorCoordinator;
    } else if (user.roles.cache.has(IDs.roles.staff.verifierCoordinator)) {
      name = 'verifier';
      id = IDs.roles.staff.verifierCoordinator;
    } else if (user.roles.cache.has(IDs.roles.staff.eventCoordinator)) {
      name = 'event';
      id = IDs.roles.staff.eventCoordinator;
    } else if (user.roles.cache.has(IDs.roles.staff.mediaCoordinator)) {
      name = 'media';
      id = IDs.roles.staff.mediaCoordinator;
    } else if (user.roles.cache.has(IDs.roles.staff.hrCoordinator)) {
      name = 'hr';
      id = IDs.roles.staff.hrCoordinator;
    } else {
      name = 'coordinator';
      id = IDs.roles.staff.coordinator;
    }
    return [name, id];
  }

  private async checkPrivate(user: Snowflake, coordinator: string) {
    const category = await getCategoryChannel(IDs.categories.private);

    if (!isCategoryChannel(category)) {
      return true;
    }

    const textChannels = category.children.cache.filter(
      (c) => c.type === ChannelType.GuildText,
    );

    let exists = false;

    for (const c of textChannels) {
      const channel = c[1];

      if (!isTextChannel(channel)) {
        continue;
      }

      // Checks if the channel topic has the user's snowflake
      if (
        channel.topic !== null &&
        channel.topic.includes(user) &&
        channel.topic.includes(coordinator)
      ) {
        exists = true;
      }
    }
    return exists;
  }
}
