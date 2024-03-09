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

import { AllFlowsPrecondition } from '@sapphire/framework';
import type {
  CommandInteraction,
  ContextMenuCommandInteraction,
  Message,
  GuildMember,
} from 'discord.js';
import IDs from '#utils/ids';

export class OutreachLeaderOnlyPrecondition extends AllFlowsPrecondition {
  public override async messageRun(message: Message) {
    // for message command
    return this.checkCoordinator(message.member!);
  }

  public override async chatInputRun(interaction: CommandInteraction) {
    // for slash command
    return this.checkCoordinator(interaction.member! as GuildMember);
  }

  public override async contextMenuRun(
    interaction: ContextMenuCommandInteraction,
  ) {
    // for context menu command
    return this.checkCoordinator(interaction.member! as GuildMember);
  }

  private async checkCoordinator(user: GuildMember) {
    return user.roles.cache.has(IDs.roles.staff.outreachLeader)
      ? this.ok()
      : this.error({ message: 'Only outreach leaders can run this command!' });
  }
}

declare module '@sapphire/framework' {
  interface Preconditions {
    OutreachLeaderOnly: never;
  }
}