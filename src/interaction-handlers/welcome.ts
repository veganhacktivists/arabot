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
import type { ButtonInteraction, GuildMember, TextChannel } from 'discord.js';
import IDs from '#utils/ids';

export class WelcomeButtonHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
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
    let { member } = interaction;
    const general = this.container.client.channels.cache.get(
      IDs.channels.nonVegan.general,
    ) as TextChannel | undefined;
    if (general === undefined) {
      return;
    }

    if (member === null) {
      await interaction.reply({
        content:
          'There was an error giving you the role, please try again later or contact ModMail to be let into this server.',
        ephemeral: true,
      });
      return;
    }

    try {
      member = member as GuildMember;

      // Give non-vegan role
      if (!member.voice.channel) {
        await member.roles.add(IDs.roles.nonvegan.nonvegan);

        await general.send(
          `${member} Welcome to ARA! :D Please check <#${IDs.channels.information.roles}> ` +
            `and remember to follow the <#${IDs.channels.information.conduct}> and to respect ongoing discussion and debates.` +
            "\n\nIf you would like to be verified as a vegan, join the 'Verification' voice channel.",
        );
        return;
      }

      await interaction.reply({
        content:
          "You're currently in a verification, you'll have to leave the verification or get verified before being able to access the server again.",
        ephemeral: true,
      });
    } catch (error) {
      await interaction.reply({
        content:
          'There was an error giving you the role, please try again later or contact ModMail to be let into this server.',
        ephemeral: true,
      });
    }
  }
}
