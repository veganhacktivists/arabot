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

    I used the Sapphire documentation and parts of the code from the Sapphire CLI to
    create this file.
*/

import { LogLevel, SapphireClient } from '@sapphire/framework';
import { ScheduleManager } from './utils/scheduleManager';

require('dotenv').config();

// Setting up the Sapphire client
const client = new SapphireClient({
  defaultPrefix: process.env.DEFAULT_PREFIX,
  loadMessageCommandListeners: true,
  logger: {
    level: LogLevel.Debug,
  },
  intents: [
    'GUILDS',
    'GUILD_MEMBERS',
    'GUILD_BANS',
    'GUILD_EMOJIS_AND_STICKERS',
    'GUILD_VOICE_STATES',
    'GUILD_MESSAGES',
    'GUILD_MESSAGE_REACTIONS',
    'DIRECT_MESSAGES',
    'DIRECT_MESSAGE_REACTIONS',
  ],
});

// Main function to log in
const main = async () => {
  try {
    const token = process.env.DISCORD_TOKEN;
    client.logger.info('Logging in');
    await client.login(token);
    client.logger.info('Logged in');
  } catch (error) {
    client.logger.fatal(error);
    client.destroy();
    process.exit(1);
  }

  // Scheduled Commands
  await ScheduleManager();
};

main();
