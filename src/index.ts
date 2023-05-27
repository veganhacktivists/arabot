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

import { GatewayIntentBits } from 'discord.js';
import { LogLevel, SapphireClient, container } from '@sapphire/framework';
import '@sapphire/plugin-scheduled-tasks/register';
import '@sapphire/plugin-logger/register';
import { PrismaClient } from '@prisma/client';

// Setting up the Sapphire client
const client = new SapphireClient({
  defaultPrefix: process.env.DEFAULT_PREFIX,
  loadMessageCommandListeners: true,
  logger: {
    level: LogLevel.Debug,
  },
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  tasks: {
    bull: {
      connection: {
        host: process.env.REDIS_URL,
      },
    },
  },
});

// Main function to log in
const main = async () => {
  try {
    const token = process.env.DISCORD_TOKEN;
    client.logger.info('Logging in');
    container.database = await new PrismaClient();
    await client.login(token);
    client.logger.info('Logged in');
  } catch (error) {
    client.logger.fatal(error);
    await container.database.$disconnect();
    client.destroy();
    process.exit(1);
  }
};

declare module '@sapphire/pieces' {
  interface Container {
    database: PrismaClient;
  }
}

main();
