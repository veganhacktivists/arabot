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
import type { User, Guild, Message } from 'discord.js';
import { updateUser } from '#utils/database/dbExistingUser';
import { getBalance } from '#utils/database/economy';
import { EmbedBuilder } from 'discord.js';

export class BalanceCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'balance',
      aliases: ['bal'],
      description: 'Gets the amount of ARAs you have',
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder.setName(this.name).setDescription(this.description),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const { user, guild } = interaction;

    if (guild === null) {
      await interaction.reply({
        content: 'Could not find the guild!',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    const info = await this.balance(user, guild);

    await interaction.editReply({
      content: info.message,
      embeds: info.embeds,
    });
  }

  public async messageRun(message: Message) {
    const user = message.member?.user;
    const { guild } = message;

    if (user === undefined) {
      await message.react('❌');
      await message.reply('Could not find your user!');
      return;
    }

    if (guild === null) {
      await message.react('❌');
      await message.reply('Could not find the guild!');
      return;
    }

    const info = await this.balance(user, guild);

    await message.reply({
      content: info.message,
      embeds: info.embeds,
    });
    if (!info.success) {
      await message.react('❌');
    }
  }

  private async balance(user: User, guild: Guild) {
    const info = {
      message: '',
      embeds: [] as EmbedBuilder[],
      success: false,
    };

    const member = guild.members.cache.get(user.id);

    if (member === undefined) {
      info.message = 'Could not find your guild member!';
      return info;
    }

    await updateUser(member);

    const balance = await getBalance(user.id);

    const embed = new EmbedBuilder()
      .setColor('#00ff7d')
      .setAuthor({
        name: `${member.displayName}'s Account`,
        iconURL: `${user.displayAvatarURL()}`,
      })
      .addFields({ name: 'Balance', value: `${balance.balance} ARA` });

    info.success = true;
    info.embeds.push(embed);
    return info;
  }
}
