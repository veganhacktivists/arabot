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

import devIDs from '#utils/devIDs';

let IDs = {
  roles: {
    trusted: '731563158011117590',
    booster: '731213264540795012',
    nonvegan: {
      nonvegan: '774763753308815400',
      vegCurious: '832656046572961803',
      convinced: '797132019166871612',
    },
    vegan: {
      vegan: '788114978020392982',
      activist: '730915638746546257',
      nvAccess: '1076857105648209971',
      plus: '798682625619132428',
      araVegan: '995394977658044506',
    },
    restrictions: {
      sus: '859145930640457729',
      muted: '730924813681688596',
      softMute: '775934741139554335',
      restricted1: '809769217477050369',
      restricted2: '872482843304001566',
      restricted3: '856582673258774538',
      restricted4: '872472182888992858',
      restricted: [
        '809769217477050369', // Restricted 1
        '872482843304001566', // Restricted 2
        '856582673258774538', // Restricted 3
        '872472182888992858', // Restricted 4
        '1075951477379567646', // Restricted Vegan
      ],
    },
    staff: {
      coordinator: '993636242019323904',
      devCoordinator: '966031741099855973',
      modCoordinator: '974144947613728818',
      diversityCoordinator: '948284375827640321',
      mentorCoordinator: '947905630939807785',
      verifierCoordinator: '940721280376778822',
      eventCoordinator: '944732860554817586',
      outreachCoordinator: '954804769476730890',
      mediaCoordinator: '1203778509449723914',
      hrCoordinator: '1203802120180989993',
      outreachLeader: '730915698544607232',
      restricted: '851624392928264222',
      moderator: '826157475815489598',
      trialModerator: '982074555596152904',
      verifier: '871802735031373856',
      trialVerifier: '982635638010572850',
      mentor: '802752882831130624',
      diversity: '965482239913762826',
      developer: '792089759338070048',
    },
    stageHost: '854893757593419786',
    patron: '765370219207852055',
    patreon: '993848684640997406',
    verifyBlock: '1032765019269640203',
    bookClub: '955516408249352212',
    debateHost: '935508325615931443',
    gameNightHost: '952779915701415966',
    guest: '866015159658217552',
  },
  channels: {
    information: {
      news: '866000393259319306',
      conduct: '990728521531920385',
      roles: '990761562199457813',
      suggestions: '831940452609556511',
    },
    staff: {
      coordinators: '1006240682505142354',
      mailbox: '972364104838824116',
      standup: '996009201237233684',
      verifiers: '873215538627756072',
    },
    welcome: '992027842906955888',
    dietSupport: {
      info: '993891104346873888',
      introduction: '993272252743286874',
      main: '822665615612837918',
    },
    nonVegan: {
      general: '798967615636504657',
    },
    vegan: {
      general: '787738272616808509',
    },
    activism: {
      activism: '730907954877956179',
    },
    diversity: {
      diversity: '1062703409398026250',
      women: '938808963544285324',
      lgbtqia: '956224226556272670',
      potgm: '956224095509442600',
      disabilities: '933078769365823518',
    },
    misc: {
      counting: '1172995918828666941',
    },
    restricted: {
      welcome: '992060036312481874',
      moderators: '928349536395604029',
      restricted: '847880218521632788',
      tolerance: '856516474120962048',
    },
    logs: {
      restricted: '920993034462715925',
      economy: '932050015034159174',
      sus: '872884989950324826',
    },
  },
  categories: {
    staff: '768685283583328257',
    modMail: '867077297664426006',
    verification: '797505409073676299',
    diversity: '933078380394459146',
    private: '992581296901599302',
    restricted: '809765577236283472',
  },
};

// Check if the bot is in development mode
if (process.env.DEVELOPMENT === 'true') {
  IDs = devIDs;
}

export default IDs;
