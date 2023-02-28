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

import { Subcommand } from '@sapphire/plugin-subcommands';
import { RegisterBehavior } from '@sapphire/framework';
import { updateUser } from '#utils/database/dbExistingUser';
import {
  checkActiveEvent,
  createEvent,
  createStat,
  getCurrentEvent, getStatGroups,
} from '#utils/database/outreach';

export class OutreachCommand extends Subcommand {
  public constructor(context: Subcommand.Context, options: Subcommand.Options) {
    super(context, {
      ...options,
      name: 'outreach',
      description: 'Tools for doing outreach',
      subcommands: [
        {
          name: 'event',
          type: 'group',
          entries: [
            { name: 'create', chatInputRun: 'eventCreate' },
            { name: 'start', chatInputRun: 'eventStart' },
            { name: 'end', chatInputRun: 'eventEnd' },
          ],
        },
        {
          name: 'group',
          type: 'group',
          entries: [
            { name: 'create', chatInputRun: 'groupCreate' },
            { name: 'add', chatInputRun: 'groupAdd' },
            { name: 'update', chatInputRun: 'groupUpdate' },
          ],
        },
      ],
      preconditions: ['ModOnly'],
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommandGroup((group) => group.setName('event')
          .setDescription('Commands to do with outreach events')
          .addSubcommand((command) => command.setName('create')
            .setDescription('Start an outreach event')
            .addBooleanOption((option) => option.setName('start')
              .setDescription('Start the event immediately')))
          .addSubcommand((command) => command.setName('start')
            .setDescription('Start an outreach event'))
          .addSubcommand((command) => command.setName('end')
            .setDescription('End an outreach event')))
        .addSubcommandGroup((group) => group.setName('group')
          .setDescription('Commands to do with groups')
          .addSubcommand((command) => command.setName('create')
            .setDescription('Create a group for people doing activism')
            .addUserOption((option) => option.setName('leader')
              .setDescription('This is the person leading the group')
              .setRequired(true)))
          .addSubcommand((command) => command.setName('add')
            .setDescription('Add a person to the group')
            .addStringOption((option) => option.setName('group')
              .setDescription('Group to add the user to')
              .setRequired(true))
            .addStringOption((option) => option.setName('user')
              .setDescription('User to add to the group')
              .setRequired(true)))
          .addSubcommand((command) => command.setName('update')
            .setDescription('Update the statistics for the group')
            .addIntegerOption((option) => option.setName('vegan')
              .setDescription('How many said would go vegan?'))
            .addIntegerOption((option) => option.setName('considered')
              .setDescription('How many seriously considered being vegan?'))
            .addIntegerOption((option) => option.setName('thanked')
              .setDescription('How many thanked you for the conversation?'))
            .addIntegerOption((option) => option.setName('documentary')
              .setDescription('How many said they would watch a vegan documentary?'))
            .addIntegerOption((option) => option.setName('educated')
              .setDescription('How many got educated on veganism or the animal industry?')))),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  public async eventCreate(interaction: Subcommand.ChatInputCommandInteraction) {
    // const start = interaction.options.getBoolean('start');
    const modInteraction = interaction.member;
    const { guild } = interaction;

    if (modInteraction === null || guild === null) {
      await interaction.reply({
        content: 'Mod or guild was not found!',
        ephemeral: true,
      });
      return;
    }

    const mod = guild.members.cache.get(modInteraction.user.id);

    if (mod === undefined) {
      await interaction.reply({
        content: 'Mod was not found!',
        ephemeral: true,
      });
      return;
    }

    if (await checkActiveEvent()) {
      await interaction.reply({
        content: 'There is already an active event!',
        ephemeral: true,
      });
      return;
    }

    await updateUser(mod);

    await createEvent(modInteraction.user.id);
  }

  public async groupCreate(interaction: Subcommand.ChatInputCommandInteraction) {
    const leader = interaction.options.getUser('leader', true);
    const { guild } = interaction;

    if (guild === null) {
      await interaction.reply({
        content: 'Guild not found!',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const event = await getCurrentEvent();

    if (event === null) {
      await interaction.editReply({
        content: 'There is no current event!',
      });
      return;
    }

    const statGroups = await getStatGroups(event.id);
    const groupNo = statGroups.length + 1;

    const role = await guild.roles.create({ name: `Outreach Group ${groupNo}` });

    await createStat(event.id, leader.id, role.id);

    await interaction.reply({
      content: `Created a group with the leader being ${leader}`,
      ephemeral: true,
    });
  }
}
