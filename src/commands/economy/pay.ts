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
import type { User, Guild, Message } from 'discord.js';
import { updateUser } from '#utils/database/dbExistingUser';
import { getBalance, transfer } from '#utils/database/economy';
import { EmbedBuilder, TextChannel } from 'discord.js';
import IDs from '#utils/ids';

export class BalanceCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'pay',
      description: 'Give a user an amount of money',
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) => option.setName('user')
          .setDescription('The user to give the money to')
          .setRequired(true))
        .addIntegerOption((option) => option.setName('amount')
          .setDescription('The amount to give to the user')
          .setMinValue(1)
          .setRequired(true))
        .addStringOption((option) => option.setName('reason')
          .setDescription('The reason/reference for the transaction')
          .setRequired(true)),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const recipient = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);
    const reason = interaction.options.getString('reason', true);
    const { user, guild } = interaction;

    if (guild === null) {
      await interaction.reply({
        content: 'Could not find the guild!',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    const info = await this.pay(user, recipient, amount, reason, guild);

    await interaction.editReply({
      content: info.message,
      embeds: info.embeds,
    });
  }

  public async messageRun(message: Message, args: Args) {
    let recipient: User;
    try {
      recipient = await args.pick('user');
    } catch {
      await message.react('❌');
      await message.reply('User was not provided!');
      return;
    }

    let amount: number;
    try {
      amount = await args.pick('integer');
    } catch {
      await message.react('❌');
      await message.reply('Amount was not provided!');
      return;
    }

    const reason = args.finished ? null : await args.rest('string');

    if (reason === null) {
      await message.react('❌');
      await message.reply('Reason/reference was not provided!');
      return;
    }

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

    const info = await this.pay(user, recipient, amount, reason, guild);

    await message.reply({
      content: info.message,
      embeds: info.embeds,
    });
    if (!info.success) {
      await message.react('❌');
    }
  }

  private async pay(user: User, recipient: User, amount: number, reason: string, guild: Guild) {
    const info = {
      message: '',
      embeds: [] as EmbedBuilder[],
      success: false,
    };

    // Check the amount to be paid is greater than 0
    if (amount < 1) {
      info.message = 'You need to actually give money, you can\'t send nothing or try to break the '
          + 'economy 😭';
      return info;
    }

    const member = guild.members.cache.get(user.id);
    const recipientMember = guild.members.cache.get(recipient.id);

    if (member === undefined) {
      info.message = 'Could not find your guild member!';
      return info;
    }

    if (recipientMember === undefined) {
      info.message = 'Could not find the user!';
      return info;
    }

    await updateUser(member);
    await updateUser(recipientMember);

    const balance = await getBalance(user.id);

    if (balance.balance < amount) {
      info.message = 'You don\'t have enough money to send!';
      return info;
    }

    await transfer(user.id, recipient.id, amount, reason);

    const embed = new EmbedBuilder()
      .setColor('#00ff7d')
      .setAuthor({ name: `Transfer to ${recipientMember.displayName}`, iconURL: `${recipientMember.displayAvatarURL()}` })
      .addFields(
        { name: 'From', value: `${user}`, inline: true },
        { name: 'To', value: `${recipient}`, inline: true },
        { name: 'Amount', value: `${amount} ARA` },
        { name: 'Reason', value: reason },
      );

    info.success = true;
    info.embeds.push(embed);

    // Log the payment in the server
    let logChannel = guild.channels.cache
      .get(IDs.channels.logs.economy) as TextChannel | undefined;

    if (logChannel === undefined) {
      logChannel = await guild.channels
        .fetch(IDs.channels.logs.economy) as TextChannel | undefined;
      if (logChannel === undefined) {
        this.container.logger.error('Pay Error: Could not fetch log channel');
        return info;
      }
    }

    const logEmbed = new EmbedBuilder(embed.data);
    logEmbed
      .setTimestamp()
      .setFooter({ text: `ID: ${user.id}` });
    await logChannel.send({ embeds: [logEmbed] });
    return info;
  }
}
