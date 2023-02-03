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
import IDs from '../../utils/ids';

class ActivistCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'activist',
      aliases: ['a'],
      description: 'Gives the activist role',
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
          .setDescription('User to give activist role to')
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
    const activist = guild.roles.cache.get(IDs.roles.vegan.activist);
    const verCoordinator = guild.roles.cache.get(IDs.roles.staff.verifierCoordinator);

    // Checks if guildMember is null
    if (guildMember === undefined
      || modMember === undefined
      || activist === undefined
      || verCoordinator === undefined) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Checks if the user is an activist
    if (guildMember.roles.cache.has(IDs.roles.vegan.activist)
      && !(modMember.roles.cache.has(IDs.roles.staff.verifierCoordinator)
      || modMember.roles.cache.has(IDs.roles.staff.modCoordinator))) {
      await interaction.reply({
        content: `${user} is an activist, only ${verCoordinator.name} can run this!`,
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Checks if the user has Activist and to give them or remove them based on if they have it
    if (guildMember.roles.cache.has(IDs.roles.vegan.activist)) {
      // Remove the Activist role from the user
      await guildMember.roles.remove(activist);
      await interaction.reply({
        content: `Removed the ${activist.name} role from ${user}`,
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Add Activist role to the user
    await guildMember.roles.add(activist);
    await interaction.reply({
      content: `Gave ${user} the ${activist.name} role!`,
      ephemeral: true,
      fetchReply: true,
    });

    const activistMsg = `${user} you have been given the ${activist.name} role by ${mod}! `
      + `This means that if you'd wish to engage with non-vegans in <#${IDs.channels.nonVegan.general}>, you should follow these rules:\n\n`
      + '1. Try to move conversations with non-vegans towards veganism/animal ethics\n'
      + '2. Don\'t discuss social topics while activism is happening\n'
      + '3. Have evidence for claims you make. "I don\'t know" is an acceptable answer. Chances are someone here knows or you can take time to find out\n'
      + '4. Don\'t advocate for baby steps towards veganism. Participation in exploitation can stop today\n'
      + '5. Differences in opinion between activists should be resolved in vegan spaces, not in the chat with non-vegans';
    await guildMember.send(activistMsg)
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
    const activist = guild.roles.cache.get(IDs.roles.vegan.activist);
    const verCoordinator = guild.roles.cache.get(IDs.roles.staff.verifierCoordinator);

    if (activist === undefined
      || verCoordinator === undefined) {
      await message.react('❌');
      await message.reply('Role not found! Try again or contact a developer!');
      return;
    }

    // Checks if the user is an activist
    if (user.roles.cache.has(IDs.roles.vegan.activist)
      && !(mod.roles.cache.has(IDs.roles.staff.verifierCoordinator)
      || mod.roles.cache.has(IDs.roles.staff.modCoordinator))) {
      await message.reply({
        content: `${user} is an activist, only ${verCoordinator.name} can run this!`,
      });
      await message.react('❌');
      return;
    }

    // Checks if the user has Activist and to give them or remove them based on if they have it
    if (user.roles.cache.has(IDs.roles.vegan.activist)) {
      // Remove the Activist role from the user
      await user.roles.remove(activist);
      await message.react('✅');
      return;
    }

    // Add Activist role to the user
    await user.roles.add(activist);
    await message.react('✅');

    const activistMsg = `${user} you have been given the ${activist.name} role by ${mod}! `
      + `This means that if you'd wish to engage with non-vegans in <#${IDs.channels.nonVegan.general}>, you should follow these rules:\n\n`
      + '1. Try to move conversations with non-vegans towards veganism/animal ethics\n'
      + '2. Don\'t discuss social topics while activism is happening\n'
      + '3. Have evidence for claims you make. "I don\'t know" is an acceptable answer. Chances are someone here knows or you can take time to find out\n'
      + '4. Don\'t advocate for baby steps towards veganism. Participation in exploitation can stop today\n'
      + '5. Differences in opinion between activists should be resolved in vegan spaces, not in the chat with non-vegans';
    await user.send(activistMsg)
      .catch(() => {});
  }
}

export default ActivistCommand;
