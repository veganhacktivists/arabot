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

import { Command, RegisterBehavior } from '@sapphire/framework';
import { isMessageInstance } from '@sapphire/discord.js-utilities';
import IDs from '../../utils/ids';

export class purgeVerifyingCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'purgeverifying',
      description: 'Purges all the users who have the "verify-as-vegan" role',
      preconditions: [['DevCoordinatorOnly', 'VerifierCoordinatorOnly']],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    // TODO add database updates
    // Get the arguments
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (guild === null) {
      await interaction.reply({
        content: 'Error getting guild!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    const message = await interaction.reply({
      content: 'Fetching all members on the server, this may take a while...',
      fetchReply: true,
    });

    // Checks if the message is not an APIMessage
    if (!isMessageInstance(message)) {
      await interaction.editReply('Failed to retrieve the message :(');
      return;
    }

    // Get all the members
    await guild!.members.fetch();
    // Gets the verify-as-vegan and Not Vegan role
    const getVerVegan = guild!.roles.cache.get(IDs.roles.verifyingAsVegan);
    const getNotVegan = guild!.roles.cache.get(IDs.roles.nonvegan.nonvegan);

    // Checks if getVerVegan or getNotVegan is null
    if (getVerVegan === null || getNotVegan === null) {
      await interaction.editReply({
        content: 'Error getting roles!',
      });
      return;
    }

    // Gets all users that have the verify-as-vegan role
    const verVegan = getVerVegan!.members.map((member) => member);
    const verVeganLength = verVegan.length;
    let otherRoles = 0;
    const apiTimeout = 2500;

    function calcETA(timeout: number, increment: number, endIncrement: number) {
      const minutes = Math.floor(((timeout / 1000) * (endIncrement - increment - 1)) / 60);
      const seconds = Math.floor((timeout / 1000) * (endIncrement - increment - 1))
        - (minutes * 60);
      return `${minutes}:${(seconds < 10 ? '0' : '') + seconds}`;
    }

    await interaction.editReply(`Processing ${verVeganLength} users...\nEstimated time to completion: ${calcETA(apiTimeout, 0, verVeganLength)}`);

    // Goes through every member with the verify-as-vegan role
    for (let i = 0; i < verVeganLength; i += 1) {
      const member = verVegan[i];
      if (member.roles.cache.has(IDs.roles.nonvegan.nonvegan)
        || member.roles.cache.has(IDs.roles.vegan.vegan)) {
        otherRoles += 1;
        continue;
      }
      // Runs command based on apiTimeout so that Discord API does not get spammed and bans the bot
      setTimeout(async () => {
        // Removes the role from the user
        await member.roles.remove(IDs.roles.verifyingAsVegan);
        await member.roles.add(IDs.roles.nonvegan.nonvegan);
      }, apiTimeout * (i - otherRoles));
    }

    // Change reply to include how many have been skipped
    await interaction.editReply(`Processing ${verVeganLength - otherRoles} users...\nEstimated time to completion: ${calcETA(apiTimeout, 0, (verVeganLength - otherRoles))}`);

    /* Disabled due to invalid webhook token - most likely expired
    // Set the timeout for the completion
    setTimeout(
      async () => {
        await interaction.editReply(`Successfully gave all ${getVerVegan!.name} users the ${getNotVegan!.name} role!`);
      },
      apiTimeout * verVeganLength,
    );
 */
  }
}
