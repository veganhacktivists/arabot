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
import { GuildBan } from 'discord.js';
import IDs from '../../utils/ids';
import { removeBan, checkActive, addBan } from '../../utils/database/ban';

class UnbanCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'unban',
      description: 'Unbans a user',
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
          .setDescription('User to unban')
          .setRequired(true)),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    // Get the arguments
    const user = interaction.options.getUser('user');
    const mod = interaction.member;
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (user === null || guild === null || mod === null) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    if (!await checkActive(user.id)) {
      let ban: GuildBan;
      try {
        ban = await guild.bans.fetch(user.id);
      } catch {
        try {
          ban = await guild.bans.fetch({ user, force: true });
        } catch {
          await interaction.reply({
            content: `${user} is not banned.`,
          });
          return;
        }
      }
      let { reason } = ban;

      if (reason === null || reason === undefined) {
        reason = '';
      }

      // Add missing ban
      await addBan(user.id, mod.user.id, `(Mod who banned is not accurate) - ${reason}`);
    }

    // Unban the user
    await guild.members.unban(user)
      .catch(() => {});

    // Add unban to database
    await removeBan(user.id, mod.user.id);

    await interaction.reply({
      content: `${user} has been unbanned.`,
      ephemeral: true,
      fetchReply: true,
    });

    // Log the ban
    let modRestrict = guild.channels.cache.get(IDs.channels.restricted.moderators) as TextChannel | undefined;

    if (modRestrict === undefined) {
      modRestrict = await guild.channels.fetch(IDs.channels.restricted.moderators) as TextChannel | undefined;
      if (modRestrict === undefined) {
        console.error('Unban Error: Could not fetch mod channel');
        return;
      }
    }

    await modRestrict.send(`${user} was unbanned by ${mod}`);
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

    const mod = message.member;

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

    if (!await checkActive(user.id)) {
      let ban: GuildBan;
      try {
        ban = await guild.bans.fetch(user.id);
      } catch {
        try {
          ban = await guild.bans.fetch({ user, force: true });
        } catch {
          await message.react('❌');
          await message.reply({
            content: `${user} is not banned.`,
          });
          return;
        }
      }
      let { reason } = ban;

      if (reason === null || reason === undefined) {
        reason = '';
      }

      // Add missing ban
      await addBan(user.id, mod.user.id, `(Mod who banned is not accurate) - ${reason}`);
    }

    // Unban the user
    await guild.members.unban(user)
      .catch(() => {});

    // Add unban to database
    await removeBan(user.id, mod.id);

    await message.react('✅');

    await message.reply({
      content: `${user} has been unbanned.`,
    });

    // Log the ban
    let modRestrict = guild.channels.cache.get(IDs.channels.restricted.moderators) as TextChannel | undefined;

    if (modRestrict === undefined) {
      modRestrict = await guild.channels.fetch(IDs.channels.restricted.moderators) as TextChannel | undefined;
      if (modRestrict === undefined) {
        console.error('Unban Error: Could not fetch mod channel');
        return;
      }
    }

    await modRestrict.send(`${user} was unbanned by ${mod}`);
  }
}

export default UnbanCommand;
