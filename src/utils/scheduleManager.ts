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

import { CronJob } from 'cron';
import { standupRun } from '../schedules/standup';

export async function ScheduleManager() {
  // TODO add a way to automatically add all schedules in the schedules folder
  // Define Jobs:
  // Standup
  const standup = new CronJob(
    '00 00 12 * * 1',
    (async () => {
      await standupRun();
    }),
  );

  // Start Jobs:
  standup.start();
}
