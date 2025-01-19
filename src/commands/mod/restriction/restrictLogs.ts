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
import { ChannelType, EmbedBuilder, MessageFlagsBitField } from 'discord.js';
import type { Message, TextChannel, Guild, Snowflake } from 'discord.js';
import IDs from '#utils/ids';
import { getRestrictions } from '#utils/database/moderation/restriction';
import { checkStaff } from '#utils/checker';

export class RestrictLogsCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'restrictlogs',
      description: 'Shows restriction history for a user',
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
              .setDescription('User to check restriction logs for'),
          ),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // Get the arguments
    const user = interaction.options.getUser('user');
    let { channel } = interaction;
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (guild === null || channel === null) {
      await interaction.reply({
        content: 'Error fetching guild or channel!',
        flags: MessageFlagsBitField.Flags.Ephemeral,
        withResponse: true,
      });
      return;
    }

    let userId: Snowflake | null = null;

    if (user !== undefined && user !== null) {
      userId = user.id;
    }

    const staffChannel = checkStaff(channel);
    if (staffChannel) {
      channel = channel as TextChannel;

      if (userId === null) {
        let topic: string[];

        if (channel.parentId === IDs.categories.modMail) {
          // Checks if the channel topic has the user's snowflake
          if (channel.topic !== null) {
            topic = channel.topic.split(' ');
            userId = topic[2];
          }
        }
      }

      if (userId === null) {
        await interaction.reply({
          content: 'User could not be found or was not provided!',
          flags: MessageFlagsBitField.Flags.Ephemeral,
          withResponse: true,
        });
        return;
      }

      const info = await this.unRestrictRun(userId, guild);

      await interaction.reply({
        embeds: info.embeds,
        content: info.message,
        withResponse: true,
        flags: staffChannel ? undefined : MessageFlagsBitField.Flags.Ephemeral,
      });
    }
  }

  // Non Application Command method of banning a user
  public async messageRun(message: Message, args: Args) {
    // Get arguments
    let userId: Snowflake | null;
    try {
      const user = await args.pick('user');
      userId = user.id;
    } catch {
      userId = null;
    }

    const { guild } = message;

    if (guild === null) {
      await message.react('❌');
      await message.reply('Guild not found! Try again or contact a developer!');
      return;
    }

    if (userId === null) {
      const { channel } = message;

      if (channel.type !== ChannelType.GuildText) {
        await message.react('❌');
        await message.reply('User was not provided!');
        return;
      }

      let topic: string[];

      if (channel.parentId === IDs.categories.modMail) {
        // Checks if the channel topic has the user's snowflake
        if (channel.topic !== null) {
          topic = channel.topic.split(' ');
          // eslint-disable-next-line prefer-destructuring
          userId = topic[2];
        }
      }
    }

    if (userId === null) {
      await message.react('❌');
      await message.reply('User was not provided!');
      return;
    }

    const info = await this.unRestrictRun(userId, guild);

    await message.reply({ content: info.message, embeds: info.embeds });
    if (!info.success) {
      await message.react('❌');
    }
  }

  private async unRestrictRun(userId: Snowflake, guild: Guild) {
    const info = {
      message: '',
      embeds: [] as EmbedBuilder[],
      success: false,
    };

    let user = guild.client.users.cache.get(userId);

    if (user === undefined) {
      user = await guild.client.users.fetch(userId).catch(() => undefined);
      if (user === undefined) {
        info.message = 'Error fetching user';
        return info;
      }
    }

    const restrictions = await getRestrictions(userId);

    if (restrictions.length === 0) {
      info.message = `${user} user has no restrict logs on them.`;
      return info;
    }

    // Creates the embed to display the restrictions
    const embed = new EmbedBuilder()
      .setColor('#FF6700')
      .setTitle(`${restrictions.length} restrictions for ${user.tag}`)
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: `ID: ${userId}` });

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

    info.embeds.push(embed);
    info.success = true;
    return info;
  }
}
