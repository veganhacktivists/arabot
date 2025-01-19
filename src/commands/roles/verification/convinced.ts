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
import { Guild, User, Message, MessageFlagsBitField } from 'discord.js';
import IDs from '#utils/ids';
import { roleAddLog, roleRemoveLog } from '#utils/logging/role';
import { getGuildMember, getRole } from '#utils/fetcher';
import { isGuildMember } from '@sapphire/discord.js-utilities';
import { isRole } from '#utils/typeChecking';

export class ConvincedCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'convinced',
      aliases: ['conv'],
      description: 'Gives the convinced role',
      preconditions: [['MentorOnly', 'VerifierOnly', 'ModOnly']],
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
              .setDescription('User to give convinced to')
              .setRequired(true),
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

    const info = await this.manageConvinced(user, mod, guild);

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

    const info = await this.manageConvinced(user, mod, guild);

    await message.reply(info.message);
    await message.react(info.success ? '✅' : '❌');
  }

  private async manageConvinced(user: User, mod: User, guild: Guild) {
    const info = {
      message: '',
      success: false,
    };
    const member = await getGuildMember(user.id, guild);
    const convinced = await getRole(IDs.roles.nonvegan.convinced, guild);

    // Checks if user's GuildMember was found in cache
    if (!isGuildMember(member)) {
      info.message = 'Error fetching guild member for the user!';
      return info;
    }

    if (!isRole(convinced)) {
      info.message = 'Error fetching coordinator role from cache!';
      return info;
    }

    if (member.roles.cache.has(IDs.roles.vegan.vegan)) {
      info.message = `${user} is already vegan, cannot give the ${convinced.name} role!`;
      return info;
    }

    // Checks if the user has Convinced and to give them or remove them based on if they have it
    if (member.roles.cache.has(IDs.roles.nonvegan.convinced)) {
      // Remove the Convinced role from the user
      await member.roles.remove(convinced);
      await roleRemoveLog(user.id, mod.id, convinced);
      info.message = `Removed the ${convinced.name} role from ${user}`;
      info.success = true;
      return info;
    }
    // Add Convinced role to the user
    await member.roles.add(convinced);
    await roleAddLog(user.id, mod.id, convinced);
    info.message = `Gave ${user} the ${convinced.name} role!`;

    await user
      .send(
        `You have been given the ${convinced.name} role by ${mod}!` +
          '\n\nThis role allows you to get access to the Diet Support section in this server that can help you go vegan ' +
          'and other parts of the server! :)' +
          '\n\nThank you for caring about the animals 💚',
      )
      .catch(() => {});

    info.success = true;
    return info;
  }
}
