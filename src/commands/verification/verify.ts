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
import type {
  Message,
  User,
  Guild,
  Snowflake,
} from 'discord.js';
import IDs from '#utils/ids';
import { finishVerifyMessages, giveVerificationRoles } from '#utils/verification';
import { manualVerification } from '#utils/database/verification';

export class VerifyCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'verify',
      aliases: ['ver'],
      description: 'Gives roles to the user',
      preconditions: [['ModCoordinatorOnly', 'VerifierCoordinatorOnly', 'VerifierOnly']],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) => option.setName('user')
          .setDescription('User to give the roles to')
          .setRequired(true))
        .addStringOption((option) => option.setName('roles')
          .setDescription('Roles to give to the user')
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
    const roles = interaction.options.getString('roles', true);
    const verifier = interaction.user;
    const { guild } = interaction;
    const messageId = interaction.id;

    // Checks if all the variables are of the right type
    if (guild === null) {
      await interaction.reply({
        content: 'Error fetching guild!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    const verify = await this.verify(user, verifier.id, roles, messageId, guild);

    await interaction.reply({
      content: verify.message,
      fetchReply: true,
    });
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

    const roles = args.finished ? null : await args.rest('string');

    if (roles === null) {
      await message.react('❌');
      await message.reply('Roles were not provided!');
      return;
    }

    const verifier = message.author;

    const { guild } = message;

    if (guild === null) {
      await message.react('❌');
      await message.reply('Guild not found! Try again or contact a developer!');
      return;
    }

    const verify = await this.verify(user, verifier.id, roles, message.id, guild);

    await message.reply(verify.message);
    await message.react(verify.success ? '✅' : '❌');
  }

  private async verify(
    user: User,
    verifierId: Snowflake,
    rolesString: string,
    messageId: Snowflake,
    guild: Guild,
  ) {
    const info = {
      message: '',
      success: false,
    };

    const roles = {
      vegan: false,
      activist: false,
      araVegan: false,
      trusted: false,
      vegCurious: false,
      convinced: false,
    };

    let member = guild.members.cache.get(user.id);

    // Checks if member is null
    if (member === undefined) {
      member = await guild.members.fetch(user.id)
        .catch(() => undefined);
      if (member === undefined) {
        info.message = 'Failed to fetch member';
        return info;
      }
    }

    if (member.roles.cache.hasAny(...IDs.roles.restrictions.restricted)) {
      info.message = 'Can\'t verify a restricted user!';
      return info;
    }

    let verifier = guild.members.cache.get(verifierId);

    // Checks if verifier is null
    if (verifier === undefined) {
      verifier = await guild.members.fetch(user.id)
        .catch(() => undefined);
      if (verifier === undefined) {
        info.message = 'Failed to fetch verifier';
        return info;
      }
    }

    const roleArgs = rolesString.split(' ');

    roleArgs.forEach((role) => {
      switch (role.toLowerCase()) {
        case 'v':
          roles.vegan = true;
          break;
        case 'a':
          roles.activist = true;
          break;
        case 'x':
          roles.araVegan = true;
          break;
        case 't':
          roles.trusted = true;
          break;
        case 'nv':
          break;
        case 'veg':
          roles.vegCurious = true;
          break;
        case 'conv':
          roles.convinced = true;
          break;
        default:
          info.message = 'There was an invalid argument!';
          break;
      }
    });

    if (info.message.length > 0) {
      return info;
    }

    if ((roles.vegan || member.roles.cache.has(IDs.roles.vegan.vegan))
      && (roleArgs.includes('nv') || roles.vegCurious || roles.convinced)) {
      info.message = 'Can\'t give non-vegan roles to a vegan';
      return info;
    }

    if (roleArgs.includes('nv')
      && (roles.vegan || roles.activist || roles.araVegan)) {
      info.message = 'Can\'t give vegan roles to a non-vegan';
      return info;
    }

    await giveVerificationRoles(member, roles, true);

    await finishVerifyMessages(user, roles, true);

    await manualVerification(messageId, member, verifier, roles);

    if (member.roles.cache.has(IDs.roles.nonvegan.nonvegan)
      && (roles.vegan || roles.activist || roles.araVegan)) {
      await member.roles.remove([
        IDs.roles.nonvegan.nonvegan,
        IDs.roles.nonvegan.vegCurious,
        IDs.roles.nonvegan.convinced,
      ]);
    }

    info.success = true;
    info.message = `Verified ${user}`;
    return info;
  }
}
