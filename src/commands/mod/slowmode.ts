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
import { Message, MessageFlagsBitField, TextBasedChannel } from 'discord.js';
import { ChannelType } from 'discord.js';
import { Duration, DurationFormatter } from '@sapphire/time-utilities';
import { isNumber } from '#utils/maths';

export class SlowmodeCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'slowmode',
      description: 'Sets slowmode for a channel',
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
          .addStringOption((option) =>
            option
              .setName('duration')
              .setDescription('Set the slowmode time')
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
    const duration = interaction.options.getString('duration', true);
    const { channel } = interaction;

    if (channel === null) {
      await interaction.reply({
        content: 'Could not fetch channel!',
        flags: MessageFlagsBitField.Flags.Ephemeral,
        withResponse: true,
      });
      return;
    }

    const slowmode = await this.slowmode(duration, channel);

    await interaction.reply({ content: slowmode.message });
  }

  public async messageRun(message: Message, args: Args) {
    // Get arguments
    const duration = args.finished ? null : await args.rest('string');
    const { channel } = message;

    if (duration === null) {
      await message.react('❌');
      await message.reply('Slowmode length was not provided!');
      return;
    }

    const slowmode = await this.slowmode(duration, channel);

    await message.reply(slowmode.message);
    await message.react(slowmode.success ? '✅' : '❌');
  }

  private async slowmode(duration: string, channel: TextBasedChannel) {
    const info = {
      message: '',
      success: false,
    };
    if (channel.type !== ChannelType.GuildText) {
      info.message = 'Channel is not a text channel!';
      return info;
    }

    let durationCheck = duration;

    if (isNumber(durationCheck)) {
      durationCheck += 's';
    }

    const durationParsed = new Duration(durationCheck);
    let time = 0;

    if (Number.isNaN(durationParsed.offset)) {
      if (duration !== 'off') {
        info.message = 'Invalid time format!';
        return info;
      }
      time = 0;
    } else {
      time = durationParsed.offset;
    }

    await channel.setRateLimitPerUser(time / 1000);

    info.success = true;
    if (time === 0) {
      info.message = `${channel} is no longer in slowmode.`;
      return info;
    }

    info.message = `${channel} has now been set to a post every ${new DurationFormatter().format(
      time,
    )}.`;
    return info;
  }
}
