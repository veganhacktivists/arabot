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

export class InfoCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'info',
      description: 'Get more information about this server',
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addStringOption((option) =>
            option
              .setName('info')
              .setDescription('Information you want')
              .setRequired(true)
              .addChoices(
                { name: 'Trusted', value: 'trusted' },
                { name: 'Veg Curious', value: 'vegCurious' },
                { name: 'Verification', value: 'verification' },
                { name: 'ModMail', value: 'modMail' },
              ),
          )
          .addBooleanOption((option) =>
            option
              .setName('visible')
              .setDescription(
                'If you want this this information visible to everyone',
              ),
          ),
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
        message =
          'The trusted role (✅) gives you permissions to send images and share your screen and use the ' +
          "camera (unless you're a minor) on voice chats.\n\n" +
          'If you want the trusted role, please contact a moderator the moderators will determine whether ' +
          'you can have the role. This depends on your behaviour on the server.';
        break;
      case 'vegCurious':
        message =
          'Would you like the Veg Curious role? It will allow you access to our diet support section where our ' +
          'mentors can assist you. Mentors can provide product or substitution suggestions as well as other advice. ' +
          'They also host a stage that highlights new recipes weekly, which you will get pinged for.\n\n' +
          "If you're interested in the role, ask a member of staff or DM ModMail for the role. This role is " +
          'available for non-vegans and vegans that are genuinely interested in learning more about plant-based ' +
          'diets!';
        break;
      case 'verification':
        message =
          "If you want to have the vegan or activist role, you'll need to do a voice verification. " +
          "To do this, hop into the 'Verification' voice channel." +
          "\n\nIf there aren't any verifiers available, you'll be disconnected, and you can rejoin later.";
        break;
      case 'modMail':
        message =
          'If you would like to contact the Moderators privately, the best way to do so would be to send a ' +
          'ModMail.\n\n' +
          'To do so, you will have to DM <@575252669443211264> then send it a message and it will prompt you to ' +
          'set up ModMail. Once you have set up ModMail, you can send a message and you will have to select this ' +
          "server to send it to. You will get a message from ModMail saying 'Message Sent' when we have received " +
          'your message!';
        break;
      default:
        message =
          "You're not supposed to find this, here's a virtual vegan cookie! :D";
    }

    await interaction.reply({
      content: message,
      ephemeral,
    });
  }
}
