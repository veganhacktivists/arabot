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

import { Args, Command, RegisterBehavior } from '@sapphire/framework';
import type { Guild, Message, Snowflake, User } from 'discord.js';
import { EmbedBuilder, MessageFlagsBitField } from 'discord.js';
import IDs from '#utils/ids';
import { addExistingUser, fetchRoles } from '#utils/database/dbExistingUser';
import {
  checkActive,
  unRestrict,
  unRestrictLegacy,
} from '#utils/database/moderation/restriction';
import {
  getCategoryChannel,
  getGuildMember,
  getTextBasedChannel,
  getUser,
  getVoiceChannel,
} from '#utils/fetcher';
import { isUser } from '#utils/typeChecking';
import {
  isCategoryChannel,
  isGuildMember,
  isTextBasedChannel,
  isTextChannel,
  isVoiceChannel,
} from '@sapphire/discord.js-utilities';

export class UnRestrictCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'unrestrict',
      aliases: ['ur', 'urv'],
      description: 'Unrestricts a user',
      preconditions: ['ModOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addUserOption((option) =>
            option
              .setName('user')
              .setDescription('User to unrestrict')
              .setRequired(true),
          ),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // Get the arguments
    const user = interaction.options.getUser('user', true);
    const mod = interaction.user;
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (guild === null) {
      await interaction.reply({
        content: 'Error fetching guild!',
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();

    const info = await this.unRestrictRun(user.id, mod.id, guild);

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

    const mod = message.author;

    const { guild } = message;

    if (guild === null) {
      await message.react('❌');
      await message.reply('Guild not found! Try again or contact a developer!');
      return;
    }

    const channelRun = message.channel;

    const info = await this.unRestrictRun(
      user.id,
      mod.id,
      guild,
      channelRun.id,
    );

    if (!info.runInVeganRestrict) {
      await message.reply(info.message);
      await message.react(info.success ? '✅' : '❌');
    }
  }

  private async unRestrictRun(
    userId: Snowflake,
    modId: Snowflake,
    guild: Guild,
    channelRun: Snowflake | null = null,
  ) {
    const info = {
      message: '',
      success: false,
      runInVeganRestrict: false,
    };

    const user = await getUser(userId);

    if (!isUser(user)) {
      info.message = 'Error fetching user';
      return info;
    }

    // Gets mod's GuildMember
    const mod = await getGuildMember(modId, guild);

    // Checks if guildMember is null
    if (!isGuildMember(mod)) {
      info.message = 'Error fetching mod';
      return info;
    }

    // Check if mod is in database
    await addExistingUser(mod);

    // Gets guildMember
    const member = await getGuildMember(userId, guild);

    if (!isGuildMember(member)) {
      info.message = "Can't unrestrict the user as they are not on this server";
      return info;
    }

    // Check if user is in database
    await addExistingUser(member);

    const restrictRoles = IDs.roles.restrictions.restricted;

    // Checks if the user is not restricted
    if (!member.roles.cache.hasAny(...restrictRoles)) {
      info.message = `${user} is not restricted!`;
      return info;
    }

    if (await checkActive(userId)) {
      const roles = await fetchRoles(userId);
      await member.roles.add(roles);

      // Unrestricts the user on the database
      await unRestrict(userId, modId);
    } else {
      let section = 1;

      for (let i = 0; i < restrictRoles.length; i += 1) {
        if (member.roles.cache.has(restrictRoles[i])) {
          section = i + 1;
        }
      }

      await member.roles.add(IDs.roles.nonvegan.nonvegan);

      // Unrestricts the user on the database but for restricts done on the old bot
      await unRestrictLegacy(userId, modId, section);
    }

    await member.roles.remove(restrictRoles);

    // Remove vegan restrict channels
    if (member.roles.cache.has(IDs.roles.vegan.vegan)) {
      const category = await getCategoryChannel(IDs.categories.restricted);

      if (!isCategoryChannel(category)) {
        info.message =
          'Could not find the restricted category! The channels will have to be deleted manually.';
        return info;
      }

      let topic: string[];

      const textChannels = category.children.cache.filter((channel) =>
        isTextChannel(channel),
      );

      for (const c of textChannels) {
        const channel = c[1];

        // Checks that the channel is a text channel
        if (!isTextChannel(channel)) {
          continue;
        }

        // Checks that the channel has a topic
        if (channel.topic === null) {
          continue;
        }

        // Checks if the channel topic has the user's snowflake
        if (channel.topic.includes(userId)) {
          if (channel.id === channelRun) {
            info.runInVeganRestrict = true;
          }

          topic = channel.topic.split(' ');
          const vcId = topic[topic.indexOf(user.id) + 1];
          const voiceChannel = await getVoiceChannel(vcId);

          if (
            isVoiceChannel(voiceChannel) &&
            // Used for sanitising the channel topic, so another voice channel does not get deleted
            voiceChannel.parentId === IDs.categories.restricted
          ) {
            await voiceChannel.delete();
          }

          await channel.delete();
        }
      }
    }

    info.success = true;

    // Log the ban
    const logChannel = await getTextBasedChannel(IDs.channels.logs.restricted);

    if (!isTextBasedChannel(logChannel)) {
      this.container.logger.error('Unrestrict: Could not fetch log channel');
      info.message = `Unrestricted ${user} but could not find the log channel. This has been logged to the database.`;

      return info;
    } else if (!logChannel.isSendable()) {
      this.container.logger.error(
        'Unrestrict: The bot does not have permission to send in the logs channel!',
      );
      info.message = `Unrestricted ${user} but could not find the log channel. This hasn't been logged in a text channel as the bot does not have permission to send logs!`;

      return info;
    }

    const message = new EmbedBuilder()
      .setColor('#28A745')
      .setAuthor({
        name: `Unrestricted ${user.tag}`,
        iconURL: `${user.displayAvatarURL()}`,
      })
      .addFields(
        { name: 'User', value: `${user}`, inline: true },
        { name: 'Moderator', value: `${mod}`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: `ID: ${userId}` });

    await logChannel.send({ embeds: [message] });

    info.message = `Unrestricted ${user}`;
    return info;
  }
}
