// SPDX-License-Identifier: GPL-3.0-or-later
/*
    Animal Rights Advocates Discord Bot
    Copyright (C) 2022  Anthony Berg

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
import type { GuildMember, Message, TextChannel } from 'discord.js';
import IDs from '../../utils/ids';

class BanCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'ban',
      description: 'Bans a user',
      preconditions: ['ModOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) => option.setName('user')
          .setDescription('User to ban')
          .setRequired(true))
        .addStringOption((option) => option.setName('reason')
          .setDescription('Note about the user')
          .setRequired(true)),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    // TODO add database updates
    // Get the arguments
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const mod = interaction.member;
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (user === null || guild === null || reason === null || mod === null) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Gets guildMember whilst removing the ability of each other variables being null
    const guildMember = guild.members.cache.get(user.id);

    // Checks if guildMember is null
    if (guildMember === undefined) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Checks if the user is not restricted
    if (guildMember.roles.cache.has(IDs.roles.vegan.vegan)
    || guildMember.roles.cache.has(IDs.roles.nonvegan.nonvegan)) {
      await interaction.reply({
        content: `You need to restrict ${user} first!`,
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Send DM for reason of ban
    await guildMember.send(`You have been banned from ARA for: ${reason}`
    + '\n\nhttps://vbcamp.org/ARA')
      .catch();

    // Ban the user
    await guildMember.ban({ reason });

    await interaction.reply({
      content: `${user} has been banned.`,
      ephemeral: true,
      fetchReply: true,
    });

    // Log the ban
    let logChannel = guild.channels.cache.get(IDs.channels.logs.restricted) as TextChannel | undefined;

    if (logChannel === undefined) {
      logChannel = await guild.channels.fetch(IDs.channels.logs.restricted) as TextChannel | undefined;
      if (logChannel === undefined) {
        console.error('Ban Error: Could not fetch log channel');
        return;
      }
    }

    await logChannel.send(`${user} was banned for: ${reason} by ${mod}`);
  }

  // Non Application Command method of banning a user
  public async messageRun(message: Message, args: Args) {
    // Get arguments
    let user: GuildMember;
    try {
      user = await args.pick('member');
    } catch {
      await message.react('❌');
      await message.reply('User was not provided!');
      return;
    }
    const reason = args.finished ? null : await args.rest('string');
    const mod = message.member;

    if (reason === null) {
      await message.react('❌');
      await message.reply('Ban reason was not provided!');
      return;
    }

    if (mod === null) {
      await message.react('❌');
      await message.reply('Moderator not found! Try again or contact a developer!');
      return;
    }

    const { guild } = message;

    if (guild === null) {
      await message.react('❌');
      await message.reply('Guild not found! Try again or contact a developer!');
      return;
    }

    if (message.channel.id !== IDs.channels.restricted.moderators) {
      await message.react('❌');
      await message.reply(`You can only run this command in <#${IDs.channels.restricted.moderators}> `
      + 'or alternatively use the slash command!');
      return;
    }

    // Checks if the user is not restricted
    if (user.roles.cache.has(IDs.roles.vegan.vegan)
      || user.roles.cache.has(IDs.roles.nonvegan.nonvegan)) {
      await message.react('❌');
      await message.reply({
        content: 'You need to restrict the user first!',
      });
      return;
    }

    // Send DM for reason of ban
    await user.send(`You have been banned from ARA for: ${reason}`
      + '\n\nhttps://vbcamp.org/ARA')
      .catch();

    // Ban the user
    await user.ban({ reason });

    await message.react('✅');

    // Log the ban
    let logChannel = guild.channels.cache.get(IDs.channels.logs.restricted) as TextChannel | undefined;

    if (logChannel === undefined) {
      logChannel = await guild.channels.fetch(IDs.channels.logs.restricted) as TextChannel | undefined;
      if (logChannel === undefined) {
        console.error('Ban Error: Could not fetch log channel');
        return;
      }
    }

    await logChannel.send(`${user} was banned for: ${reason} by ${mod}`);
  }
}

export default BanCommand;
