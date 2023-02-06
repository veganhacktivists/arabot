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
import IDs from '@utils/ids';

class VegCuriousCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
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
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) => option.setName('user')
          .setDescription('User to give veg curious to')
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
    const mentor = interaction.member;
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (user === null || mentor === null || guild === null) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Gets guildMember whilst removing the ability of each other variables being null
    const guildMember = guild.members.cache.get(user.id);
    const mentorMember = guild.members.cache.get(mentor.user.id);
    const vegCurious = guild.roles.cache.get(IDs.roles.nonvegan.vegCurious);
    const mentorCoordinator = guild.roles.cache.get(IDs.roles.staff.mentorCoordinator);
    const dietSupport = guild.channels.cache.get(IDs.channels.dietSupport.main);

    // Checks if guildMember is null
    if (guildMember === undefined
      || mentorMember === undefined
      || vegCurious === undefined
      || mentorCoordinator === undefined
      || dietSupport === undefined) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Checks if the user is vegan
    if (guildMember.roles.cache.has(IDs.roles.vegan.vegan)
      && !mentorMember.roles.cache.has(IDs.roles.staff.mentorCoordinator)) {
      await interaction.reply({
        content: `${user} is vegan, only ${mentorCoordinator.name} can run this!`,
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Checks if the user has Veg Curious and to give them or remove them based on if they have it
    if (guildMember.roles.cache.has(IDs.roles.nonvegan.vegCurious)) {
      // Remove the Veg Curious role from the user
      await guildMember.roles.remove(vegCurious);
      await interaction.reply({
        content: `Removed the ${vegCurious.name} role from ${user}`,
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Add Veg Curious role to the user
    await guildMember.roles.add(vegCurious);
    await interaction.reply({
      content: `Gave ${user} the ${vegCurious.name} role!`,
      ephemeral: true,
      fetchReply: true,
    });

    await guildMember.send(`You have been given the ${vegCurious.name} role by ${mentor.user} `
      + `which gives you access to ${dietSupport}`).catch(() => {});
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

    const mentor = message.member;

    if (mentor === null) {
      await message.react('❌');
      await message.reply('Mentor not found! Try again or contact a developer!');
      return;
    }

    const { guild } = message;

    if (guild === null) {
      await message.react('❌');
      await message.reply('Guild not found! Try again or contact a developer!');
      return;
    }

    const vegCurious = guild.roles.cache.get(IDs.roles.nonvegan.vegCurious);
    const mentorCoordinator = guild.roles.cache.get(IDs.roles.staff.mentorCoordinator);
    const dietSupport = guild.channels.cache.get(IDs.channels.dietSupport.main);

    if (vegCurious === undefined
      || mentorCoordinator === undefined
      || dietSupport === undefined) {
      await message.react('❌');
      await message.reply('Role not found! Try again or contact a developer!');
      return;
    }

    // Checks if the user is vegan
    if (user.roles.cache.has(IDs.roles.vegan.vegan)
      && !mentor.roles.cache.has(IDs.roles.staff.mentorCoordinator)) {
      await message.reply({
        content: `${user} is vegan, only ${mentorCoordinator.name} can run this!`,
      });
      await message.react('❌');
      return;
    }

    // Checks if the user has Veg Curious and to give them or remove them based on if they have it
    if (user.roles.cache.has(IDs.roles.nonvegan.vegCurious)) {
      // Remove the Veg Curious role from the user
      await user.roles.remove(vegCurious);
      await message.react('✅');
      return;
    }

    // Add Veg Curious role to the user
    await user.roles.add(vegCurious);
    await message.react('✅');

    await user.send(`You have been given the ${vegCurious.name} role by ${mentor.user} `
      + `which gives you access to ${dietSupport}`).catch(() => {});
  }
}

export default VegCuriousCommand;
