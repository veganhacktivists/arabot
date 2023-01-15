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
import type { GuildMember, Message } from 'discord.js';
import IDs from '../../utils/ids';

class TrustedCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'trusted',
      aliases: ['t', 'trust'],
      description: 'Gives/removes the trusted role',
      preconditions: [['VerifierOnly', 'ModOnly']],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) => option.setName('user')
          .setDescription('User to give/remove trusted to')
          .setRequired(true)),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // TODO add database updates
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

    // Gets guildMember whilst removing the ability of each other variables being null
    const guildMember = guild.members.cache.get(user.id);
    const trusted = guild.roles.cache.get(IDs.roles.trusted);

    // Checks if guildMember is null
    if (guildMember === undefined || trusted === undefined) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Checks if the user has Convinced and to give them or remove them based on if they have it
    if (guildMember.roles.cache.has(IDs.roles.trusted)) {
      // Remove the Veg Curious role from the user
      await guildMember.roles.remove(trusted);
      await interaction.reply({
        content: `Removed the ${trusted.name} role from ${user}`,
        fetchReply: true,
      });
      return;
    }
    // Add Convinced role to the user
    await guildMember.roles.add(trusted);
    await interaction.reply({
      content: `Gave ${user} the ${trusted.name} role!`,
      fetchReply: true,
    });
    await user.send(`You have been given the ${trusted.name} role by ${mod}!`
      + '\n\nThis role allows you to post attachments to the server and stream in VCs.'
      + '\nMake sure that you follow the rules, don\'t post anything NSFW, anything objectifying animals and follow Discord\'s ToS.'
      + `\nNot following these rules can result in the removal of the ${trusted.name} role.`)
      .catch(() => {});
  }

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

    const trusted = guild.roles.cache.get(IDs.roles.trusted);

    if (trusted === undefined) {
      await message.react('❌');
      await message.reply('Role not found! Try again or contact a developer!');
      return;
    }

    // Checks if the user has Convinced and to give them or remove them based on if they have it
    if (user.roles.cache.has(IDs.roles.trusted)) {
      // Remove the Veg Curious role from the user
      await user.roles.remove(trusted);
      await message.reply({
        content: `Removed the ${trusted.name} role from ${user}`,
      });
    } else {
      // Give Convinced role to the user
      await user.roles.add(trusted);
      await message.reply({
        content: `Gave ${user} the ${trusted.name} role!`,
      });
      await user.send(`You have been given the ${trusted.name} role by ${mod}!`
        + '\n\nThis role allows you to post attachments to the server and stream in VCs.'
        + '\nMake sure that you follow the rules, and don\'t post anything NSFW, anything objectifying animals and follow Discord\'s ToS.'
        + `\nNot following these rules can result in the removal of the ${trusted.name} role.`)
        .catch(() => {});
    }

    await message.react('✅');
  }
}

export default TrustedCommand;
