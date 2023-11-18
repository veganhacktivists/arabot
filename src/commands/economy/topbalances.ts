// SPDX-License-Identifier: GPL-3.0-or-later
/*
    Animal Rights Advocates Discord Bot
    Copyright (C) 2023 Stefanie Merceron

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
import { Guild, GuildMember, Message, EmbedBuilder } from 'discord.js';
import { getTopBalances } from '#utils/database/economy';

export class TopBalancesCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'topbalances',
      aliases: ['topbal', 'leaderboard'],
      description: 'Shows the top 5 largest balances on the server',
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const { guild } = interaction;

    if (guild === null) {
      await interaction.reply({
        content: 'Could not find the guild!',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    const info = await this.showTopBalances(guild);

    await interaction.editReply({
      content: info.message,
      embeds: info.embeds,
    });
  }

  public async messageRun(message: Message) {
    const { guild } = message;

    if (guild === null) {
      await message.react('❌');
      await message.reply('Could not find the guild!');
      return;
    }

    const info = await this.showTopBalances(guild);

    await message.reply({
      content: info.message,
      embeds: info.embeds,
    });
    if (!info.success) {
      await message.react('❌');
    }
  }

  private async showTopBalances(guild: Guild) {
    const info = {
      message: '',
      embeds: [] as EmbedBuilder[],
      success: false,
    };

    const embed = new EmbedBuilder()
      .setColor('#cc802c')
      .setTitle('Top Balances on the Server')
      .setAuthor({ name: 'ARA', iconURL: 'https://github.com/veganhacktivists/arabot/blob/main/docs/images/logo.png?raw=true' });

    const leaders = await getTopBalances(5);
    const fetchMemberPromises: Promise<GuildMember | null>[] = [];

    for (const leader of leaders) {
      fetchMemberPromises.push(guild.members.fetch(leader.userId).catch(() => null));
    }

    const members = await Promise.all(fetchMemberPromises);

    for (let i = 0; i < leaders.length; i += 1) {
      const leader = leaders[i];
      const member = members[i];

      // Server Members Display on The Leaderboard
      if (member) {
        embed.addFields(
          {
            name: (i + 1) + '.',
            value: '[' + member.displayName + '](<https://discord.com/users/' + leader.userId + '>)',
            inline: true,
          },
          {
            name: 'Balance',
            value: leader.balance + ' ARA\'s',
            inline: true,
          },
          {
            name: '\u200b',
            value: '\u200b',
            inline: true,
          },
        );
      }
    }
    info.success = true;
    info.embeds.push(embed);
    return info;
  }
}
