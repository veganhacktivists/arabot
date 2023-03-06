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

export class InfoCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'info',
      description: 'Get more information about this server',
    });
  }

  message = 'If you want to help out in ARA and support animals at the same time, '
    + 'apply here: https://forms.gle/kgBHbB7LHFUJXhui6 and we\'ll try to get back as soon as possible!';

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) => option.setName('info')
          .setDescription('Information you want')
          .setRequired(true)
          .addChoices(
            { name: 'Trusted', value: 'trusted' },
            { name: 'Veg Curious', value: 'vegCurious' },
            { name: 'Verification', value: 'verification' },
          ))
        .addBooleanOption((option) => option.setName('visible')
          .setDescription('If you want this this information visible to everyone')),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const option = interaction.options.getString('info', true);
    let ephemeral = interaction.options.getBoolean('visible');

    if (ephemeral === null) {
      ephemeral = true;
    } else {
      ephemeral = !ephemeral;
    }

    let message: string;

    switch (option) {
      case 'trusted':
        message = 'The trusted role (✅) gives you permissions to send images and share your screen and use the '
          + 'camera (unless you\'re a minor) on voice chats.\n\n'
          + 'If you want the trusted role, please contact a moderator the moderators will determine whether '
          + 'you can have the role. This depends on your behaviour on the server.';
        break;
      case 'vegCurious':
        message = 'The veg curious role gives users access to the veg support section where they can access resources '
          + `from mentors. This allows users to ask for diet related questions in <#${IDs.channels.dietSupport.main}>.\n\n`
          + 'This role is for for users who are genuinely interested in learning more about a plant-based diet. '
          + 'If you\'re genuinely interested, approach a member of staff and ask for the role.';
        break;
      case 'verification':
        message = 'If you want to have the vegan or activist role, you\'ll need to do a voice verification. '
          + 'To do this, hop into the \'Verification\' voice channel.'
          + '\n\nIf there aren\'t any verifiers available, you\'ll be disconnected, and you can rejoin later.';
        break;
      default:
        message = 'You\'re not supposed to find this here\'s a virtual vegan cookie. Try again or contact a developer '
          + 'if this continues happening';
    }

    await interaction.reply({
      content: message,
      ephemeral,
    });
  }
}
