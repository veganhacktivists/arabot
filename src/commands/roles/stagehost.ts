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
import IDs from '../../utils/ids';

export class StageHostCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'stagehost',
      description: 'Gives the Stage Host role',
      preconditions: ['EventCoordinatorOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) => option.setName('user')
          .setDescription('User to give Stage Host to')
          .setRequired(true)),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    // TODO add database updates
    // Get the arguments
    const user = interaction.options.getUser('user');
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (user === null || guild === null) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Gets guildMember whilst removing the ability of each other variables being null
    let guildMember = guild!.members.cache.get(user!.id);
    let stageHost = guild!.roles.cache.get(IDs.roles.stageHost);

    // Checks if guildMember is null
    if (guildMember === null || stageHost === undefined) {
      await interaction.reply({
        content: 'Error fetching user!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    // Removes the possibility of guildMember being null
    guildMember = guildMember!;
    stageHost = stageHost!;

    // Checks if the user has Veg Curious and to give them or remove them based on if they have it
    if (guildMember.roles.cache.has(IDs.roles.stageHost)) {
      // Remove the Veg Curious role from the user
      await guildMember.roles.remove(stageHost);
      await interaction.reply({
        content: `Removed the ${stageHost.name} role from ${user!}`,
        fetchReply: true,
      });
      return;
    }
    // Add Veg Curious role to the user
    await guildMember.roles.add(stageHost);
    await interaction.reply({
      content: `Gave ${user!} the ${stageHost.name} role!`,
      fetchReply: true,
    });
  }
}
