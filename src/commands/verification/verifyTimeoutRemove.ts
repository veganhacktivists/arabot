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

import { Command, RegisterBehavior } from '@sapphire/framework';
import IDs from '#utils/ids';
import { checkVerificationFinish } from '#utils/database/verification';

export class VerifyTimeoutRemoveCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'verifytimeoutremove',
      description: 'Remove the verify timeout role',
      preconditions: ['VerifierOnly'],
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
              .setDescription('User to remove timeout from')
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
    const { guild } = interaction;

    // Checks if all the variables are of the right type
    if (guild === null) {
      await interaction.reply({
        content: 'Error fetching guild!',
        ephemeral: true,
        fetchReply: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    let member = guild.members.cache.get(user.id);

    if (member === undefined) {
      member = await guild.members.fetch(user.id).catch(undefined);
      if (member === undefined) {
        await interaction.editReply(`${user} is not on this server!`);
        return;
      }
    }

    if (!member.roles.cache.has(IDs.roles.verifyBlock)) {
      await interaction.editReply(`${user} is not blocked from verification!`);
      return;
    }

    if (await checkVerificationFinish(user.id)) {
      await interaction.editReply(
        `Can't remove ${user}'s role as they failed their last verification`,
      );
      return;
    }

    await member.roles.remove(IDs.roles.verifyBlock);

    await interaction.editReply(`Removed ${user}'s verification block`);
  }
}
