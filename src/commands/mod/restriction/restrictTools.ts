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
import { MessageFlagsBitField, TextChannel } from 'discord.js';
import { CategoryChannel, ChannelType } from 'discord.js';
import IDs from '#utils/ids';

export class RestrictToolsCommand extends Subcommand {
  public constructor(
    context: Subcommand.LoaderContext,
    options: Subcommand.Options,
  ) {
    super(context, {
      ...options,
      name: 'restricttools',
      subcommands: [
        {
          name: 'channel',
          type: 'group',
          entries: [{ name: 'delete', chatInputRun: 'deleteChannel' }],
        },
      ],
      description: 'Tools for managing restrictions',
      preconditions: ['RestrictedAccessOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addSubcommandGroup((group) =>
            group
              .setName('channel')
              .setDescription('Manages restricted channels')
              .addSubcommand((command) =>
                command
                  .setName('delete')
                  .setDescription('Deletes a restricted channel')
                  .addUserOption((option) =>
                    option
                      .setName('user')
                      .setDescription("The user's channel to delete"),
                  ),
              ),
          ),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  public async deleteChannel(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    // Get the arguments
    const user = interaction.options.getUser('user');
    const { guild, channel } = interaction;

    await interaction.deferReply({
      flags: MessageFlagsBitField.Flags.Ephemeral,
    });

    // Checks if all the variables are of the right type
    if (guild === null || channel === null) {
      await interaction.editReply({
        content: 'Error fetching user!',
      });
      return;
    }

    let topic: string[];

    if (user === null) {
      if (channel.type !== ChannelType.GuildText) {
        await interaction.editReply({
          content:
            'Please make sure you ran this command in the original restricted text channel!',
        });
        return;
      }

      if (channel.parentId !== IDs.categories.restricted) {
        await interaction.editReply({
          content:
            'Please make sure you ran this command in the original restricted text channel!',
        });
        return;
      }

      if (
        channel.id === IDs.channels.restricted.welcome ||
        channel.id === IDs.channels.restricted.moderators ||
        channel.id === IDs.channels.restricted.restricted ||
        channel.id === IDs.channels.restricted.tolerance
      ) {
        await interaction.editReply({
          content: "You can't run this command these channels!",
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

      const vcId = topic[3];
      const voiceChannel = guild.channels.cache.get(vcId);

      if (
        voiceChannel !== undefined &&
        voiceChannel.parentId === IDs.categories.restricted
      ) {
        await voiceChannel.delete();
      }

      return;
    }

    const category = guild.channels.cache.get(IDs.categories.restricted);

    if (!(category instanceof CategoryChannel)) {
      await interaction.editReply({
        content: 'Could not find category!',
      });
      return;
    }

    const textChannels = category.children.cache.filter(
      (c) => c.type === ChannelType.GuildText,
    );

    for (const channel of textChannels) {
      const textChannel = channel[1];

      // Checks that the channel is a text channel
      if (!(textChannel instanceof TextChannel)) {
        continue;
      }

      // Checks that the channel has a topic
      if (textChannel.topic === null) {
        continue;
      }

      // Checks if the channel topic has the user's snowflake
      if (textChannel.topic.includes(user.id)) {
        topic = textChannel.topic.split(' ');
        const vcId = topic[topic.indexOf(user.id) + 1];
        let voiceChannel = guild.channels.cache.get(vcId);

        if (voiceChannel === undefined) {
          const fetchVoiceChannel = await guild.channels
            .fetch(vcId)
            .catch(() => undefined);

          if (fetchVoiceChannel !== null && fetchVoiceChannel !== undefined) {
            voiceChannel = fetchVoiceChannel;
          }
        }

        if (
          voiceChannel !== undefined &&
          voiceChannel.parentId === IDs.categories.restricted
        ) {
          await voiceChannel.delete();
        }
        await textChannel.delete();
      }
    }

    await interaction.editReply({
      content: `Successfully deleted the channel for ${user}`,
    });
  }
}
