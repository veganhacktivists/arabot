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

import {
  InteractionHandler,
  InteractionHandlerTypes,
} from '@sapphire/framework';
import { ButtonInteraction, MessageFlagsBitField } from 'discord.js';
import IDs from '#utils/ids';
import { isGuildMember } from '@sapphire/discord.js-utilities';

export class NonVeganAccessButtonHandler extends InteractionHandler {
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
    if (interaction.customId !== 'nvAccess') return this.none();

    return this.some();
  }

  public async run(interaction: ButtonInteraction) {
    const { member } = interaction;

    const errorMessage =
      'There was an error giving you the role, please try again later or contact ModMail/the developer ' +
      'to sort out this problem.';

    if (!isGuildMember(member)) {
      await interaction.reply({
        content: errorMessage,
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
      return;
    }

    if (!member.roles.cache.has(IDs.roles.vegan.vegan)) {
      await interaction.reply({
        content: 'You need to be vegan to use this button!',
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
      return;
    } else if (member.roles.cache.has(IDs.roles.vegan.nvAccess)) {
      await member.roles.remove(IDs.roles.vegan.nvAccess);
      await interaction.reply({
        content:
          'Your access from the non vegan section has been removed. ' +
          'If you want to gain access again, click this button again.',
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
      return;
    } else {
      await member.roles.add(IDs.roles.vegan.nvAccess);
      await interaction.reply({
        content:
          'Your access to the non vegan section has been given back. ' +
          'If you want to remove access again, click this button again.',
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
    }
  }
}
