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

export class VegCuriousCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'vegcurious',
      aliases: ['veg', 'vegancurious'],
      description: 'Gives the veg curious role for vegans only',
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
              .setDescription('User to give veg curious to')
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

    const info = await this.manageVegCurious(user, mod, guild);

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

    const info = await this.manageVegCurious(user, mod, guild);

    await message.reply(info.message);
    await message.react(info.success ? '✅' : '❌');
  }

  private async manageVegCurious(user: User, mod: User, guild: Guild) {
    const info = {
      message: '',
      success: false,
    };
    const member = await getGuildMember(user.id, guild);
    const modMember = await getGuildMember(mod.id, guild);
    const vegCurious = await getRole(IDs.roles.nonvegan.vegCurious, guild);

    // Checks if user's GuildMember was found in cache
    if (!isGuildMember(member)) {
      info.message = 'Error fetching guild member for the user!';
      return info;
    }

    if (!isGuildMember(modMember)) {
      info.message = "Error fetching the staff's guild member!";
      return info;
    }

    if (!isRole(vegCurious)) {
      info.message = 'Error fetching veg curious role from cache!';
      return info;
    }

    // Checks if the command can only be run by Mentor Coordinators
    if (!modMember.roles.cache.has(IDs.roles.staff.mentorCoordinator)) {
      // Only Mentor Coordinators can remove Veg Curious role
      if (member.roles.cache.has(IDs.roles.nonvegan.vegCurious)) {
        info.message =
          'You need to be a mentor coordinator to remove this role!';
        return info;
      }

      // Only Mentor Coordinators can give vegans Veg Curious role
      if (member.roles.cache.has(IDs.roles.vegan.vegan)) {
        info.message =
          'You need to be a mentor coordinator to give vegans this role!';
        return info;
      }
    }

    // Checks if the user is Veg Curious and to give them or remove them based on if they have it
    // Remove the Veg Curious role from the user
    if (member.roles.cache.has(IDs.roles.nonvegan.vegCurious)) {
      await member.roles.remove(vegCurious);
      await roleRemoveLog(user.id, mod.id, vegCurious);
      info.message = `Removed the ${vegCurious.name} role from ${user}`;
      info.success = true;
      return info;
    }

    // Add Veg Curious role to the user
    await member.roles.add(vegCurious);
    await roleAddLog(user.id, mod.id, vegCurious);
    info.message = `Gave ${user} the ${vegCurious.name} role!`;

    await user
      .send(
        `You have been given the ${vegCurious.name} role by ${mod} ` +
          'which gives you access to the diet support section',
      )
      .catch(() => {});
    info.success = true;
    return info;
  }
}
