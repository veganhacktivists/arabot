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
import type { User, Message, TextChannel } from 'discord.js';
import IDs from '@utils/ids';
import { addBan, checkActive } from '@utils/database/ban';
import { addEmptyUser, addExistingUser, userExists } from '@utils/database/dbExistingUser';

class BanCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'ban',
      description: 'Bans a user',
      preconditions: ['RestrictedAccessOnly'],
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
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
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

    // Gets mod's GuildMember
    const modGuildMember = guild.members.cache.get(mod.user.id);

    // Checks if guildMember is null
    if (modGuildMember === undefined) {
      await interaction.reply({
        content: 'Error fetching mod!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    if (await checkActive(user.id)) {
      await interaction.reply(`${user} is already banned!`);
      return;
    }

    // Check if mod is in database
    if (!await userExists(modGuildMember.id)) {
      await addExistingUser(modGuildMember);
    }

    // Gets guildMember
    const guildMember = guild.members.cache.get(user.id);

    if (guildMember !== undefined) {
      // Checks if the user is not restricted
      if (guildMember.roles.cache.has(IDs.roles.vegan.vegan)) {
        await interaction.reply({
          content: 'You need to restrict the user first!',
          ephemeral: true,
          fetchReply: true,
        });
        return;
      }

      // Check if user and mod are on the database
      if (!await userExists(guildMember.id)) {
        await addExistingUser(guildMember);
      }

      // Send DM for reason of ban
      await user.send(`You have been banned from ARA for: ${reason}`
        + '\n\nhttps://vbcamp.org/ARA')
        .catch(() => {});

      // Ban the user
      await guildMember.ban({ reason });
    } else if (!await userExists(user.id)) {
      await addEmptyUser(user.id);
    }

    await interaction.reply({
      content: `${user} has been banned.`,
      ephemeral: true,
      fetchReply: true,
    });

    // Add ban to database
    await addBan(user.id, mod.user.id, reason);

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
    let user: User;
    try {
      user = await args.pick('user');
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

    if (await checkActive(user.id)) {
      await message.react('❌');
      await message.reply(`${user} is already banned!`);
      return;
    }

    if (message.channel.id !== IDs.channels.restricted.moderators) {
      await message.react('❌');
      await message.reply(`You can only run this command in <#${IDs.channels.restricted.moderators}> `
      + 'or alternatively use the slash command!');
      return;
    }

    // Check if mod is in database
    if (!await userExists(mod.id)) {
      await addExistingUser(mod);
    }

    // Gets guildMember
    const guildMember = guild.members.cache.get(user.id);

    if (guildMember !== undefined) {
      // Checks if the user is not restricted
      if (guildMember.roles.cache.has(IDs.roles.vegan.vegan)) {
        await message.react('❌');
        await message.reply({
          content: 'You need to restrict the user first!',
        });
        return;
      }

      // Check if user and mod are on the database
      if (!await userExists(guildMember.id)) {
        await addExistingUser(guildMember);
      }

      // Send DM for reason of ban
      await user.send(`You have been banned from ARA for: ${reason}`
        + '\n\nhttps://vbcamp.org/ARA')
        .catch(() => {});

      // Ban the user
      await guildMember.ban({ reason });
    } else if (!await userExists(user.id)) {
      await addEmptyUser(user.id);
    }

    // Add ban to database
    await addBan(user.id, mod.id, reason);

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
