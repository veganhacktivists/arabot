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

    I created this command on the 13:30 Newcastle - Kings Cross train.
    Idk why I wanted to say that, but I felt like it was a cool fact
*/

import { Args, Command, RegisterBehavior } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { ChannelType } from 'discord.js';

class MoveAllCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'moveall',
      aliases: ['mvall'],
      description: 'Moves everyone from one voice channel to the specified one',
      preconditions: ['CoordinatorOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addChannelOption((option) => option.setName('channel')
          .setDescription('The channel to move everyone to')
          .setRequired(true)),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // Get the arguments
    const channel = interaction.options.getChannel('channel', true);
    const { member } = interaction;
    const { guild } = interaction;

    if (channel.type !== ChannelType.GuildVoice
      && channel.type !== ChannelType.GuildStageVoice) {
      await interaction.reply({
        content: 'The channel you provided is not a voice channel!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Checks if all the variables are of the right type
    if (guild === null) {
      await interaction.reply({
        content: 'Error fetching guild!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    if (member === null) {
      await interaction.reply({
        content: 'Error fetching your user',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    const mod = guild.members.cache.get(member.user.id);

    if (mod === undefined) {
      await interaction.reply({
        content: 'Error fetching user from guild',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    if (mod.voice.channelId === null) {
      await interaction.reply({
        content: 'You need to be in a voice channel to run this command!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    const voice = guild.channels.cache.get(mod.voice.channelId);

    if (voice === undefined
      || !voice.isVoiceBased()) {
      await interaction.reply({
        content: 'Error fetching your current voice channel!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    voice.members.forEach((memberVC) => {
      memberVC.voice.setChannel(channel.id);
    });

    await interaction.reply({
      content: `Successfully moved ${voice.members.size} members to <#${channel.id}>!`,
      ephemeral: true,
      fetchReply: true,
    });
  }

  public async messageRun(message: Message, args: Args) {
    // Get arguments
    const channel = await args.pick('channel');

    if (!channel.isVoiceBased()) {
      await message.react('❌');
      await message.reply('You did not provide a voice based channel!');
      return;
    }

    const mod = message.member;
    const { guild } = message;

    if (mod === null) {
      await message.react('❌');
      await message.reply('Could not find your user!');
      return;
    }

    if (mod.voice.channelId === null) {
      await message.react('❌');
      await message.reply('You need to be in a voice channel to run this command!');
      return;
    }

    if (guild === null) {
      await message.react('❌');
      await message.reply('Could not find guild!');
      return;
    }

    const voice = guild.channels.cache.get(mod.voice.channelId);

    if (voice === undefined
      || !voice.isVoiceBased()) {
      await message.react('❌');
      await message.reply('Could not fetch current voice channel!');
      return;
    }

    voice.members.forEach((member) => {
      member.voice.setChannel(channel.id);
    });

    await message.reply(`Successfully moved ${voice.members.size} members to <#${channel.id}>!`);

    await message.react('✅');
  }
}

export default MoveAllCommand;
