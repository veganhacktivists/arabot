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
import { Guild, User, Message, MessageFlagsBitField } from 'discord.js';
import IDs from '#utils/ids';
import { roleAddLog, roleRemoveLog } from '#utils/logging/role';
import { getGuildMember, getRole } from '#utils/fetcher';
import { isGuildMember } from '@sapphire/discord.js-utilities';
import { isRole } from '#utils/typeChecking';

export class DebateHostCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'debatehost',
      description: 'Gives the Debate Host role',
      preconditions: ['EventCoordinatorOnly'],
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
              .setDescription('User to give Debate Host role to')
              .setRequired(true),
          ),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    // TODO add database updates
    // Get the arguments
    const user = interaction.options.getUser('user', true);
    const mod = interaction.user;
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

    await interaction.deferReply({
      flags: MessageFlagsBitField.Flags.Ephemeral,
    });

    const info = await this.manageDebateHost(user, mod, guild);

    await interaction.editReply(info.message);
  }

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

    const mod = message.author;

    const { guild } = message;

    if (guild === null) {
      await message.react('❌');
      await message.reply('Guild not found! Try again or contact a developer!');
      return;
    }

    const info = await this.manageDebateHost(user, mod, guild);

    await message.reply(info.message);
    await message.react(info.success ? '✅' : '❌');
  }

  private async manageDebateHost(user: User, mod: User, guild: Guild) {
    const info = {
      message: '',
      success: false,
    };
    const member = await getGuildMember(user.id, guild);
    const debateHost = await getRole(IDs.roles.debateHost, guild);

    // Checks if user's GuildMember was found in cache
    if (!isGuildMember(member)) {
      info.message = 'Error fetching guild member for the user!';
      return info;
    }

    if (!isRole(debateHost)) {
      info.message = 'Error fetching debate host role from cache!';
      return info;
    }

    // Checks if the user has Debate Host and to give them or remove them based on if they have it
    if (member.roles.cache.has(IDs.roles.debateHost)) {
      // Remove the Debate Host role from the user
      await member.roles.remove(debateHost);
      await roleRemoveLog(user.id, mod.id, debateHost);
      info.message = `Removed the ${debateHost.name} role from ${user}`;
      info.success = true;
      return info;
    }
    // Add Debate Host role to the user
    await member.roles.add(debateHost);
    await roleAddLog(user.id, mod.id, debateHost);
    info.message = `Gave ${user} the ${debateHost.name} role!`;

    await user
      .send(`You have been given the ${debateHost.name} role by ${mod}!`)
      .catch(() => {});
    info.success = true;
    return info;
  }
}
