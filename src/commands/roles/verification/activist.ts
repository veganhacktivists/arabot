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

export class ActivistCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'activist',
      aliases: ['a'],
      description: 'Gives the activist role',
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
              .setDescription('User to give activist role to')
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

    const info = await this.manageActivist(user, mod, guild);

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

    const info = await this.manageActivist(user, mod, guild);

    await message.reply(info.message);
    await message.react(info.success ? '✅' : '❌');
  }

  private async manageActivist(user: User, mod: User, guild: Guild) {
    const info = {
      message: '',
      success: false,
    };
    const member = await getGuildMember(user.id, guild);
    const modMember = await getGuildMember(mod.id, guild);
    const activist = await getRole(IDs.roles.vegan.activist, guild);

    // Checks if user's GuildMember was found in cache
    if (!isGuildMember(member)) {
      info.message = 'Error fetching guild member for the user!';
      return info;
    }

    if (!isGuildMember(modMember)) {
      info.message = "Error fetching the staff's guild member!";
      return info;
    }

    if (!isRole(activist)) {
      info.message = 'Error fetching activist role from cache!';
      return info;
    }

    // Checks if the user is Activist and to give them or remove them based on if they have it
    if (member.roles.cache.has(IDs.roles.vegan.activist)) {
      if (
        !modMember.roles.cache.hasAny(
          IDs.roles.staff.verifierCoordinator,
          IDs.roles.staff.modCoordinator,
          IDs.roles.staff.verifier,
        )
      ) {
        info.message =
          'You need to be a verifier coordinator, mod coordinator, or verifier to remove this role!';
        return info;
      }

      // Remove the Activist role from the user
      await member.roles.remove(activist);
      await roleRemoveLog(user.id, mod.id, activist);
      info.message = `Removed the ${activist.name} role from ${user}`;
      info.success = true;
      return info;
    }

    // Add Activist role to the user
    await member.roles.add(activist);
    await roleAddLog(user.id, mod.id, activist);
    info.message = `Gave ${user} the ${activist.name} role!`;

    await user
      .send(
        `${user} you have been given the ${activist.name} role by ${mod}! ` +
          `This means that if you'd wish to engage with non-vegans in <#${IDs.channels.nonVegan.general}>, you should follow these rules:\n\n` +
          '1. Try to move conversations with non-vegans towards veganism/animal ethics\n' +
          "2. Don't discuss social topics while activism is happening\n" +
          '3. Have evidence for claims you make. "I don\'t know" is an acceptable answer. Chances are someone here knows or you can take time to find out\n' +
          "4. Don't advocate for baby steps towards veganism. Participation in exploitation can stop today\n" +
          '5. Differences in opinion between activists should be resolved in vegan spaces, not in the chat with non-vegans',
      )
      .catch(() => {});
    info.success = true;
    return info;
  }
}
