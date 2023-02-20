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
  GuildMember,
  Message,
  User,
  Guild,
} from 'discord.js';
import IDs from '#utils/ids';
import { Snowflake } from 'discord.js';

export class VerifyCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'verify',
      aliases: ['ver'],
      description: 'Gives roles to the user',
      preconditions: [['ModCoordinatorOnly', 'VerifierCoordinatorOnly', 'VerifierOnly']],
      enabled: false,
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
    // TODO add database updates
    // Get the arguments
    const user = interaction.options.getUser('user', true);
    const roles = interaction.options.getString('roles', true);
    const mod = interaction.member;
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (mod === null || guild === null) {
      await interaction.reply({
        content: 'Error fetching moderator or guild!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    await this.verify(user, roles, guild);
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
      await message.reply('Verifier not found! Try again or contact a developer!');
      return;
    }

    const { guild } = message;

    if (guild === null) {
      await message.react('❌');
      await message.reply('Guild not found! Try again or contact a developer!');
      return;
    }
  }

  private async verify(user: User, rolesString: string, guild: Guild) {
    const info = {
      message: '',
      success: false,
    };

    const validRoles = ['v', 'a', 't', 'x', 'nv', 'veg', 'conv'];

    const member = guild.members.cache.get(user.id);

    // Checks if guildMember is null
    if (member === undefined) {
      info.message = 'Failed to fetch member';
      return info;
    }

    const roles = rolesString.split(' ');

    const giveRoles: Snowflake[] = [];

    roles.forEach((role) => {
      switch (role.toLowerCase()) {
        case 'v':
          giveRoles.push(IDs.roles.vegan.vegan);
          giveRoles.push(IDs.roles.vegan.nvAccess);
          break;
        case 'a':
          giveRoles.push(IDs.roles.vegan.activist);
          break;
        case 'x':
          giveRoles.push(IDs.roles.vegan.araVegan);
        case 't':
          giveRoles.push(IDs.roles.trusted);
          break;
        case 'nv':
          giveRoles.push(IDs.roles.nonvegan.nonvegan);
          break;
        case 'veg':
          giveRoles.push(IDs.roles.nonvegan.vegCurious);
          break;
        case 'conv':
          giveRoles.push(IDs.roles.nonvegan.convinced);
          break;
        default:
          info.message = 'There was an invalid argument!';
          break;
      }
    });

    if (info.message.length > 0) {
      return info;
    }

    if (roles.includes('v') && (roles.includes('nv') || roles.includes('veg') || roles.includes('conv'))) {
      info.message = 'Can\'t give non-vegan roles to a vegan';
      return info;
    }

    if (roles.includes('nv') && (roles.includes('v') || roles.includes('a') || roles.includes('x')))

    await member.roles.add(giveRoles);

  }
}
