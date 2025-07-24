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

export class VeganCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'vegan',
      aliases: ['v'],
      description: 'Gives the vegan role',
      preconditions: [
        ['ModCoordinatorOnly', 'VerifierCoordinatorOnly', 'VerifierOnly'],
      ],
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
              .setDescription('User to give vegan role to')
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

    const info = await this.manageVegan(user, mod, guild);

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

    const info = await this.manageVegan(user, mod, guild);

    await message.reply(info.message);
    await message.react(info.success ? '✅' : '❌');
  }

  private async manageVegan(user: User, mod: User, guild: Guild) {
    const info = {
      message: '',
      success: false,
    };
    const member = await getGuildMember(user.id, guild);
    const modMember = await getGuildMember(mod.id, guild);
    const vegan = await getRole(IDs.roles.vegan.vegan, guild);

    // Checks if user's GuildMember was found in cache
    if (!isGuildMember(member)) {
      info.message = 'Error fetching guild member for the user!';
      return info;
    }

    if (!isGuildMember(modMember)) {
      info.message = "Error fetching the staff's guild member!";
      return info;
    }

    if (!isRole(vegan)) {
      info.message = 'Error fetching vegan role from cache!';
      return info;
    }

    // Checks if the user is Vegan and to give them or remove them based on if they have it
    if (member.roles.cache.has(IDs.roles.vegan.vegan)) {
      if (
        !modMember.roles.cache.hasAny(
          IDs.roles.staff.verifierCoordinator,
          IDs.roles.staff.modCoordinator,
          IDs.roles.staff.moderator,
          IDs.roles.staff.verifier,
        )
      ) {
        info.message =
          'You need to be a verifier coordinator, mod coordinator, or verifier to remove these roles!';
        return info;
      }

      // Remove the Vegan role from the user
      await member.roles.add(IDs.roles.nonvegan.nonvegan);
      await member.roles.remove([
        vegan,
        IDs.roles.vegan.activist,
        IDs.roles.vegan.nvAccess,
      ]);
      await roleRemoveLog(user.id, mod.id, vegan);
      info.message = `Removed the ${vegan.name} role from ${user}`;
      info.success = true;
      return info;
    }

    // Add Vegan role to the user
    await member.roles.add([vegan, IDs.roles.vegan.nvAccess]);
    await member.roles.remove([
      IDs.roles.nonvegan.nonvegan,
      IDs.roles.nonvegan.convinced,
      IDs.roles.nonvegan.vegCurious,
    ]);
    await roleAddLog(user.id, mod.id, vegan);
    info.message = `Gave ${user} the ${vegan.name} role!`;

    await user
      .send(`You have been given the ${vegan.name} role by ${mod}!`)
      .catch(() => {});
    info.success = true;
    return info;
  }
}
