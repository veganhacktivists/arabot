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

const IDs = {
  roles: {
    trusted: '731563158011117590',
    nonvegan: {
      nonvegan: '774763753308815400',
      vegCurious: '832656046572961803',
      convinced: '797132019166871612',
    },
    vegan: {
      vegan: '788114978020392982',
      activist: '730915638746546257',
      plus: '798682625619132428',
    },
    restrictions: {
      sus: '859145930640457729',
      muted: '730924813681688596',
      restricted1: '809769217477050369',
      restricted2: '872482843304001566',
      restricted3: '856582673258774538',
      restricted4: '872472182888992858',
    },
    staff: {
      coordinator: '993636242019323904',
      devCoordinator: '966031741099855973',
      restricted: '851624392928264222',
      moderator: '826157475815489598',
      verifier: '871802735031373856',
    },
    patron: '765370219207852055',
  },
  channels: {
    staff: {
      coordinators: '989249700353953843',
      standup: '996009201237233684',
    },
  },
};

export { IDs };
