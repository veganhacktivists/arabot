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
import { Duration, DurationFormatter } from '@sapphire/time-utilities';
import type {
  User,
  Snowflake,
  TextChannel,
  Guild,
} from 'discord.js';
import { EmbedBuilder, Message } from 'discord.js';
import IDs from '#utils/ids';
import { addTempBan, checkTempBan } from '#utils/database/tempBan';
import { addEmptyUser, updateUser } from '#utils/database/dbExistingUser';

export class TempBanCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'tempban',
      description: 'Bans a user for a certain amount of time',
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
        .addStringOption((option) => option.setName('duration')
          .setDescription('How long to ban the user for')
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
    const user = interaction.options.getUser('user', true);
    const duration = interaction.options.getString('duration', true);
    const reason = interaction.options.getString('reason', true);
    const mod = interaction.member;
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (guild === null || mod === null) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    const time = new Duration(duration);

    if (Number.isNaN(time.offset)) {
      await interaction.reply({
        content: 'Invalid ban duration input',
      });
      return;
    }

    await interaction.deferReply();

    const ban = await this.ban(user.id, mod.user.id, time, reason, guild);

    await interaction.editReply({ content: ban.message });
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
    const arg = args.finished ? null : await args.rest('string');
    const mod = message.member;

    if (arg === null) {
      await message.react('❌');
      await message.reply('Ban reason was not provided!');
      return;
    }

    if (mod === null) {
      await message.react('❌');
      await message.reply('Moderator not found! Try again or contact a developer!');
      return;
    }

    const { duration, reason } = this.findTimeAndReason(arg);

    if (Number.isNaN(duration.offset)) {
      await message.react('❌');
      await message.reply('Invalid time length for ban!');
      return;
    }

    if (reason.length === 0) {
      await message.react('❌');
      await message.reply('Reason was not provided!');
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

    const ban = await this.ban(user.id, mod.user.id, duration, reason, guild);

    await message.reply(ban.message);
    await message.react(ban.success ? '✅' : '❌');
  }

  private findTimeAndReason(args: string) {
    const info = {
      duration: new Duration(''),
      reason: '',
    };

    if (Number.isNaN(new Duration(args).offset)) {
      return info;
    }

    const spliced = args.split(' ');
    let time = '';
    for (let i = 0; i < spliced.length; i += 1) {
      if (!Number.isNaN(new Duration(spliced[i]).offset)) {
        time += spliced[i];
      } else {
        info.reason = args.slice(args.indexOf(spliced[i]));
        break;
      }
    }

    if (time.length === 0) {
      return info;
    }

    info.duration = new Duration(time);
    return info;
  }

  private async ban(
    userId: Snowflake,
    modId: Snowflake,
    time: Duration,
    reason: string,
    guild: Guild,
  ) {
    const info = {
      message: '',
      success: false,
    };

    const banLength = new DurationFormatter().format(time.offset);

    let user = guild.client.users.cache.get(userId);

    if (user === undefined) {
      user = await guild.client.users.fetch(userId) as User;
    }

    // Gets mod's GuildMember
    const mod = guild.members.cache.get(modId);

    // Checks if guildMember is null
    if (mod === undefined) {
      info.message = 'Error fetching mod!';
      return info;
    }

    if (await checkTempBan(userId)) {
      info.message = `${user} is already temp banned!`;
      return info;
    }

    // Check if mod is in database
    await updateUser(mod);

    // Gets guildMember
    let member = guild.members.cache.get(userId);

    if (member === undefined) {
      member = await guild.members.fetch(userId)
        .catch(() => undefined);
    }

    if (member !== undefined) {
      // Checks if the user is not restricted
      if (member.roles.cache.has(IDs.roles.vegan.vegan)) {
        info.message = 'You need to restrict the user first!';
        return info;
      }

      await updateUser(member);

      // Send DM for reason of ban
      await member.send(`You have been temporarily banned from ARA for ${banLength}. Reason: ${reason}`
        + '\n\nhttps://vbcamp.org/ARA')
        .catch(() => {});

      // Ban the user
      await member.ban({ reason });
    } else {
      await addEmptyUser(userId);
    }

    // Add ban to database
    await addTempBan(userId, modId, time.fromNow, reason);

    // Create scheduled task to unban
    this.container.tasks.create('tempBan', {
      userId: user.id,
      guildId: guild.id,
    }, time.offset);

    info.message = `${user} has been temporarily banned for ${banLength}.`;
    info.success = true;

    // Log the ban
    let logChannel = guild.channels.cache
      .get(IDs.channels.logs.restricted) as TextChannel | undefined;

    if (logChannel === undefined) {
      logChannel = await guild.channels
        .fetch(IDs.channels.logs.restricted) as TextChannel | undefined;
      if (logChannel === undefined) {
        this.container.logger.error('Temp Ban Error: Could not fetch log channel');
        info.message = `${user} has been temporarily banned for ${banLength}. `
        + 'This hasn\'t been logged in a text channel as log channel could not be found';
        return info;
      }
    }

    const log = new EmbedBuilder()
      .setColor('#FF0000')
      .setAuthor({ name: `Temp Banned ${user.tag}`, iconURL: `${user.displayAvatarURL()}` })
      .addFields(
        { name: 'User', value: `${user}`, inline: true },
        { name: 'Moderator', value: `${mod}`, inline: true },
        { name: 'Duration', value: banLength },
        { name: 'Reason', value: reason },
      )
      .setTimestamp()
      .setFooter({ text: `ID: ${user.id}` });

    await logChannel.send({ embeds: [log] });

    return info;
  }
}
