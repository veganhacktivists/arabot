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
import { GuildMember, Message, MessageFlagsBitField } from 'discord.js';
import {
  addMute,
  removeMute,
  checkActive,
} from '#utils/database/moderation/vcMute';
import { addExistingUser } from '#utils/database/dbExistingUser';
import { getGuildMember } from '#utils/fetcher';
import { isGuildMember } from '@sapphire/discord.js-utilities';

export class VCMuteCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'vcmute',
      aliases: ['vmute'],
      description: 'Persists a server mute if a user is trying to bypass mute',
      preconditions: [['CoordinatorOnly', 'ModOnly']],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addUserOption((option) =>
            option
              .setName('user')
              .setDescription('User to persistently mute')
              .setRequired(true),
          )
          .addStringOption((option) =>
            option
              .setName('reason')
              .setDescription('Reason for persistently muting the user'),
          ),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // Get the arguments
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason');
    const mod = interaction.member;
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (guild === null) {
      await interaction.reply({
        content: 'Error fetching guild!',
        flags: MessageFlagsBitField.Flags.Ephemeral,
        withResponse: true,
      });
      return;
    }

    // Gets guildMember whilst removing the ability of each other variables being null
    const member = await getGuildMember(user.id, guild);

    // Checks if `member` was found
    if (!isGuildMember(member)) {
      await interaction.reply({
        content: 'Error fetching user!',
        flags: MessageFlagsBitField.Flags.Ephemeral,
        withResponse: true,
      });
      return;
    }

    // Checks if `mod` was found
    if (!isGuildMember(mod)) {
      await interaction.reply({
        content: 'Error fetching your user!',
        flags: MessageFlagsBitField.Flags.Ephemeral,
        withResponse: true,
      });
      return;
    }

    // Check if removing VC Mute
    if (await checkActive(member.id)) {
      await removeMute(member.id);
      if (member.voice.channel !== null) {
        await member.voice.setMute(false, reason === null ? undefined : reason);
      }

      await interaction.reply({
        content: `Removed server mute from ${user}`,
        flags: MessageFlagsBitField.Flags.Ephemeral,
        withResponse: true,
      });
      return;
    }

    // Check if mod is in database
    await addExistingUser(mod);

    // Add VC Mute
    if (member.voice.channel !== null) {
      await member.voice.setMute(true, reason === null ? undefined : reason);
    }
    await addMute(member.id, mod.id, reason);
    await interaction.reply({
      content: `Server muted ${user}`,
      flags: MessageFlagsBitField.Flags.Ephemeral,
      withResponse: true,
    });
  }

  public async messageRun(message: Message, args: Args) {
    // Get arguments
    let member: GuildMember;
    try {
      member = await args.pick('member');
    } catch {
      await message.react('❌');
      await message.reply('User was not provided!');
      return;
    }

    const reason = args.finished ? null : await args.rest('string');
    const mod = message.member;

    if (!isGuildMember(mod)) {
      await message.react('❌');
      await message.reply(
        'Moderator not found! Try again or contact a developer!',
      );
      return;
    }

    // Check if removing VC Mute
    if (await checkActive(member.id)) {
      await removeMute(member.id);
      if (member.voice.channel !== null) {
        await member.voice.setMute(false, reason === null ? undefined : reason);
      }

      await message.reply(`Removed server mute from ${member}`);
      await message.react('✅');
      return;
    }

    // Check if mod is in database
    await addExistingUser(mod);

    // Add VC Mute
    if (member.voice.channel !== null) {
      await member.voice.setMute(true, reason === null ? undefined : reason);
    }
    await addMute(member.id, mod.id, reason);
    await message.reply(`Server muted ${member}`);

    await message.react('✅');
  }
}
