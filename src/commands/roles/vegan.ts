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
import type { GuildMember, Message } from 'discord.js';
import IDs from '#utils/ids';

export class VeganCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'vegan',
      aliases: ['v'],
      description: 'Gives the vegan role',
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
          .setDescription('User to give vegan role to')
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
    if (user === null || mod === null || guild === null) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Gets guildMember whilst removing the ability of each other variables being null
    const guildMember = guild.members.cache.get(user.id);
    const modMember = guild.members.cache.get(mod.user.id);
    const vegan = guild.roles.cache.get(IDs.roles.vegan.vegan);
    const verCoordinator = guild.roles.cache.get(IDs.roles.staff.verifierCoordinator);

    // Checks if guildMember is null
    if (guildMember === undefined
      || modMember === undefined
      || vegan === undefined
      || verCoordinator === undefined) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Checks if the user is vegan
    if (guildMember.roles.cache.has(IDs.roles.vegan.vegan)
      && !(modMember.roles.cache.has(IDs.roles.staff.verifierCoordinator)
      || modMember.roles.cache.has(IDs.roles.staff.modCoordinator))) {
      await interaction.reply({
        content: `${user} is vegan, only ${verCoordinator.name} can run this!`,
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Checks if the user has Vegan and to give them or remove them based on if they have it
    if (guildMember.roles.cache.has(IDs.roles.vegan.vegan)) {
      // Remove the Vegan role from the user
      await guildMember.roles.add(IDs.roles.nonvegan.nonvegan);
      await guildMember.roles.remove([
        vegan,
        IDs.roles.vegan.activist,
      ]);
      await interaction.reply({
        content: `Removed the ${vegan.name} role from ${user}`,
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Add Vegan role to the user
    await guildMember.roles.add(vegan);
    await guildMember.roles.remove([
      IDs.roles.nonvegan.nonvegan,
      IDs.roles.nonvegan.convinced,
      IDs.roles.nonvegan.vegCurious,
    ]);
    await interaction.reply({
      content: `Gave ${user} the ${vegan.name} role!`,
      ephemeral: true,
      fetchReply: true,
    });

    await guildMember.send(`You have been given the ${vegan.name} role by ${mod.user}!`)
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
      await message.reply('Verifier not found! Try again or contact a developer!');
      return;
    }

    const { guild } = message;

    if (guild === null) {
      await message.react('❌');
      await message.reply('Guild not found! Try again or contact a developer!');
      return;
    }

    // Gets guildMember whilst removing the ability of each other variables being null
    const vegan = guild.roles.cache.get(IDs.roles.vegan.vegan);
    const verCoordinator = guild.roles.cache.get(IDs.roles.staff.verifierCoordinator);

    if (vegan === undefined
      || verCoordinator === undefined) {
      await message.react('❌');
      await message.reply('Role not found! Try again or contact a developer!');
      return;
    }

    // Checks if the user is vegan
    if (user.roles.cache.has(IDs.roles.vegan.vegan)
      || !(mod.roles.cache.has(IDs.roles.staff.verifierCoordinator)
      || mod.roles.cache.has(IDs.roles.staff.modCoordinator))) {
      await message.reply({
        content: `${user} is vegan, only ${verCoordinator.name} can run this!`,
      });
      await message.react('❌');
      return;
    }

    // Checks if the user has Vegan and to give them or remove them based on if they have it
    if (user.roles.cache.has(IDs.roles.vegan.vegan)) {
      // Remove the Veg Curious role from the user
      await user.roles.add(IDs.roles.nonvegan.nonvegan);
      await user.roles.remove([
        vegan,
        IDs.roles.vegan.activist,
      ]);
      await message.react('✅');
      return;
    }

    // Add Vegan role to the user
    await user.roles.add(vegan);
    await user.roles.remove([
      IDs.roles.nonvegan.nonvegan,
      IDs.roles.nonvegan.convinced,
      IDs.roles.nonvegan.vegCurious,
    ]);
    await message.react('✅');

    await user.send(`You have been given the ${vegan.name} role by ${mod.user}!`)
      .catch(() => {});
  }
}
