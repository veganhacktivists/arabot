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
import type { Guild, TextChannel } from 'discord.js';
import {
  CategoryChannel,
  ChannelType,
  EmbedBuilder,
  GuildMember,
  PermissionsBitField, Snowflake,
  time,
} from 'discord.js';
import IDs from '#utils/ids';

export class PrivateCommand extends Subcommand {
  public constructor(context: Subcommand.Context, options: Subcommand.Options) {
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
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand((command) => command.setName('create')
          .setDescription('Create a private channel')
          .addUserOption((option) => option.setName('user')
            .setDescription('User to create a private channel with')
            .setRequired(true)))
        .addSubcommand((command) => command.setName('delete')
          .setDescription('Delete a private channel')
          .addUserOption((option) => option.setName('user')
            .setDescription('User to delete a private channel from'))),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  public async create(interaction: Subcommand.ChatInputCommandInteraction) {
    // Get the arguments
    const user = interaction.options.getUser('user');
    const mod = interaction.member;
    const { guild } = interaction;

    await interaction.deferReply({ ephemeral: true });

    // Checks if all the variables are of the right type
    if (user === null || guild === null || mod === null) {
      await interaction.editReply({
        content: 'Error fetching user!',
      });
      return;
    }

    const guildMember = guild.members.cache.get(user.id);
    const modGuildMember = guild.members.cache.get(mod.user.id);

    // Checks if guildMember is null
    if (guildMember === undefined || modGuildMember === undefined) {
      await interaction.editReply({
        content: 'Error fetching users!',
      });
      return;
    }

    const [name, coordinator] = this.getCoordinator(modGuildMember);

    if (this.checkPrivate(guildMember.id, coordinator, guild)) {
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
            allow: [PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ViewChannel],
          },
        ],
      });
    } catch {
      privateChannel = await guild.channels.create({
        name: `🍂┃${guildMember.user.id}-private-${name}`,
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
      .setThumbnail(guildMember.user.displayAvatarURL())
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
    const mod = interaction.member;
    const { guild, channel } = interaction;

    await interaction.deferReply({ ephemeral: true });

    // Checks if all the variables are of the right type
    if (mod === null || guild === null || channel === null) {
      await interaction.editReply({
        content: 'Error fetching user!',
      });
      return;
    }

    const modGuildMember = guild.members.cache.get(mod.user.id);

    // Checks if guildMember is null
    if (modGuildMember === undefined) {
      await interaction.editReply({
        content: 'Error fetching users!',
      });
      return;
    }

    const coordinatorInfo = this.getCoordinator(modGuildMember);
    const coordinator = coordinatorInfo[1];
    let topic: string[];

    if (user === null) {
      if (channel.type !== ChannelType.GuildText) {
        await interaction.editReply({
          content: 'Please make sure you ran this command in the original private text channel!',
        });
        return;
      }

      if (channel.parentId !== IDs.categories.private) {
        await interaction.editReply({
          content: 'Please make sure you ran this command in the original private text channel!',
        });
        return;
      }

      if (channel.topic === null) {
        await interaction.editReply({
          content: 'There was an error with this channel\'s topic!',
        });
        return;
      }

      topic = channel.topic.split(' ');
      await channel.delete();

      const vcId = topic[topic.indexOf(coordinator) + 1];
      const voiceChannel = guild.channels.cache.get(vcId);

      if (voiceChannel !== undefined
        && voiceChannel.parentId === IDs.categories.private) {
        await voiceChannel.delete();
      }

      return;
    }
    const category = guild.channels.cache
      .get(IDs.categories.private) as CategoryChannel | undefined;

    if (category === undefined) {
      await interaction.editReply({
        content: 'Could not find category!',
      });
      return;
    }

    const textChannels = category.children.cache.filter((c) => c.type === ChannelType.GuildText);
    textChannels.forEach((c) => {
      const textChannel = c as TextChannel;
      // Checks if the channel topic has the user's snowflake
      if (textChannel.topic?.includes(user?.id)) {
        topic = textChannel.topic.split(' ');
        const vcId = topic[topic.indexOf(coordinator) + 1];
        const voiceChannel = guild.channels.cache.get(vcId);

        if (voiceChannel !== undefined
          && voiceChannel.parentId === IDs.categories.private) {
          voiceChannel.delete();
        }
        textChannel.delete();
      }
    });

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
    } else {
      name = 'coordinator';
      id = IDs.roles.staff.coordinator;
    }
    return [name, id];
  }

  private checkPrivate(user: Snowflake, coordinator: string, guild: Guild) {
    const category = guild.channels.cache
      .get(IDs.categories.private) as CategoryChannel | undefined;

    if (category === undefined) {
      return true;
    }

    const textChannels = category.children.cache.filter((c) => c.type === ChannelType.GuildText);
    let exists = false;
    textChannels.forEach((c) => {
      const textChannel = c as TextChannel;
      // Checks if the channel topic has the user's snowflake
      if (textChannel.topic?.includes(user) && textChannel.topic?.includes(coordinator)) {
        exists = true;
      }
    });
    return exists;
  }
}
