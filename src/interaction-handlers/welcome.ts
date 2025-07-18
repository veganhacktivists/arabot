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

import {
  InteractionHandler,
  InteractionHandlerTypes,
} from '@sapphire/framework';
import { ButtonInteraction, MessageFlagsBitField } from 'discord.js';
import IDs from '#utils/ids';
import { checkActive } from '#utils/database/moderation/restriction';
import { addUser } from '#utils/database/dbExistingUser';
import { getTextBasedChannel } from '#utils/fetcher';
import { isGuildMember, isTextChannel } from '@sapphire/discord.js-utilities';

export class WelcomeButtonHandler extends InteractionHandler {
  public constructor(
    ctx: InteractionHandler.LoaderContext,
    options: InteractionHandler.Options,
  ) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  public override parse(interaction: ButtonInteraction) {
    if (interaction.customId !== 'welcomeJoin') return this.none();

    return this.some();
  }

  public async run(interaction: ButtonInteraction) {
    const { member } = interaction;
    const general = await getTextBasedChannel(IDs.channels.nonVegan.general);

    // Messages that are used multiple times
    const roleErrorMessage =
      'There was an error giving you the role, please try again later or contact ModMail to be let into this server.';
    const welcomeMessage =
      `${member} Welcome to ARA! :D Please check <#${IDs.channels.information.roles}> ` +
      `and remember to follow the <#${IDs.channels.information.conduct}> and to respect ongoing discussions and debates.` +
      `\n\nIf you are vegan use \`/apply\` with the Appy bot in <#${IDs.channels.nonVegan.vcText}>, ` +
      'to be verified and gain access to more channels.';
    //, you can join the 'Verification' voice channel, or

    // Checks if general is not in the cache
    if (!isTextChannel(general)) {
      this.container.logger.error(
        'WelcomeButtonHandler: Could not find and fetch the general channel!',
      );
      await interaction.reply({
        content:
          'Sorry there was a problem trying to give you access to the server. Please try again later.',
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });

      return;
    }

    // If the member could not be found
    if (!isGuildMember(member)) {
      await interaction.reply({
        content: roleErrorMessage,
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });

      return;
    }

    // Checks if the user is currently restricted
    if (await checkActive(member.id)) {
      await interaction.reply({
        content: `You are currently restricted from this server! Contact the moderators by sending a DM to <@${IDs.modMail}>.`,
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });

      return;
    }

    // Give non-vegan role
    if (member.voice.channel) {
      await interaction.reply({
        content:
          "You're currently in a verification, you'll have to leave the verification or get verified before being able to access the server again.",
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });

      return;
    }

    // Add the user to the database
    await addUser(member.id);

    // Give the role to the member
    const role = await member.roles
      .add(IDs.roles.nonvegan.nonvegan)
      .catch(() => undefined);

    // If the role could not be given
    if (role === undefined) {
      await interaction.reply({
        content: roleErrorMessage,
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });

      return;
    }

    if (general.isSendable()) {
      await general.send(welcomeMessage);
    } else {
      this.container.logger.error(
        'WelcomeButtonHandler: The bot does not have permission to send in general!',
      );
      await member.send(welcomeMessage);
    }
  }
}
