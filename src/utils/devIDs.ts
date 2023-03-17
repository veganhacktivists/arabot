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

const devIDs = {
  roles: {
    trusted: '999431675081666599',
    nonvegan: {
      nonvegan: '999431675081666598',
      vegCurious: '999431675098447932',
      convinced: '999431675098447933',
    },
    vegan: {
      vegan: '999431675098447937',
      activist: '999431675098447934',
      nvAccess: '1076859125415301141',
      plus: '999431675010359460',
      araVegan: '999431674972618798',
    },
    restrictions: {
      sus: '999431674997788673',
      muted: '999431675123597402',
      softMute: '999431675098447940',
      restricted1: '999431674997788677',
      restricted2: '999431674997788676',
      restricted3: '999431674997788675',
      restricted4: '999431674997788674',
      restricted: [
        '999431674997788677', // Restricted 1
        '999431674997788676', // Restricted 2
        '999431674997788675', // Restricted 3
        '999431674997788674', // Restricted 4
        '1075952207091994726', // Restricted Vegan
      ],
    },
    staff: {
      coordinator: '999431675165556822',
      devCoordinator: '999431675165556818',
      modCoordinator: '999431675140382806',
      diversityCoordinator: '999431675140382808',
      mentorCoordinator: '999431675140382809',
      verifierCoordinator: '999431675140382810',
      eventCoordinator: '999431675165556817',
      outreachCoordinator: '999431675140382807',
      restricted: '999431675123597407',
      moderator: '999431675123597408',
      trialModerator: '999431675123597404',
      verifier: '999431675123597406',
      trialVerifier: '999431675123597405',
      mentor: '999431675140382801',
      diversity: '999431675123597410',
      developer: '792089759338070048',
    },
    stageHost: '999431675123597411',
    patron: '999431675098447935',
    patreon: '999431675098447936',
    verifyBlock: '1007477161835372574',
    bookClub: '999431675140382803',
    debateHost: '999431675140382805',
    gameNightHost: '999431675140382804',
    guest: '999431674997788672',
  },
  channels: {
    information: {
      news: '999431676058927247',
      conduct: '999431676058927248',
      roles: '999431676058927250',
      suggestions: '999431676058927251',
    },
    staff: {
      coordinators: '999431676058927254',
      mailbox: '999431676289622182',
      standup: '999431676289622183',
      verifiers: '999431677006860411',
    },
    welcome: '999431677006860410',
    dietSupport: {
      info: '999431677006860417',
      introduction: '999431677325615184',
      main: '999431677325615185',
    },
    nonVegan: {
      general: '999431677325615189',
    },
    vegan: {
      general: '999431677535338575',
    },
    activism: {
      activism: '999431678214807604',
    },
    diversity: {
      diversity: '1069047027515805868',
      women: '999431679053660187',
      lgbtqia: '999431679053660188',
      potgm: '999431679053660189',
      disabilities: '999431679527628810',
    },
    restricted: {
      welcome: '999431679812845655',
      moderators: '999431679812845656',
      restricted: '999431680295194684',
      tolerance: '999431680295194685',
    },
    logs: {
      restricted: '999431681217937513',
      economy: '999431681599623198',
    },
  },
  categories: {
    staff: '999431676058927253',
    modMail: '999431676633563236',
    verification: '999431677006860409',
    diversity: '999431679053660185',
    private: '999431679527628818',
    restricted: '999431679812845654',
  },
};

export default devIDs;
