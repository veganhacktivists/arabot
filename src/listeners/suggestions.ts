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

import { Listener } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import type { Message } from 'discord.js';
import IDs from '#utils/ids';
import { getTextBasedChannel } from '#utils/fetcher';
import { isTextChannel } from '@sapphire/discord.js-utilities';

export class Suggestions extends Listener {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options,
  ) {
    super(context, {
      ...options,
      event: 'messageCreate',
    });
  }

  public async run(message: Message) {
    if (message.channelId !== IDs.channels.information.suggestions) {
      return;
    }

    const mailbox = await getTextBasedChannel(IDs.channels.staff.mailbox);

    if (!isTextChannel(mailbox)) {
      this.container.logger.error(
        'Mailbox is not a TextBased channel or is undefined',
      );

      return;
    } else if (!mailbox.isSendable()) {
      this.container.logger.error(
        'Suggestions: The bot does not have permissions to send messages in the mailbox!',
      );

      return;
    }

    const attachments: string[] = [];
    let attachmentsString = '';

    message.attachments.forEach((attachment) => {
      attachments.push(attachment.url);
      attachmentsString += `${attachment.url}\n`;
    });

    const suggestion = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setAuthor({
        name: `Suggestion from ${message.author.tag}:`,
        iconURL: `${message.author.displayAvatarURL()}`,
      })
      .setTimestamp();

    if (message.content.length > 0) {
      suggestion.setDescription(message.content);
      if (attachments.length > 0) {
        suggestion.setFields({ name: 'Attachments', value: attachmentsString });
      }
    } else if (attachments.length > 0) {
      suggestion.setFields({ name: 'Attachments', value: attachmentsString });
    } else {
      await message.delete();
      await message.author
        .send({
          content:
            'There was an error sending your suggestion, please try again later or contact the devs!',
        })
        .catch(() => {});
      return;
    }

    const sent = await mailbox.send({
      embeds: [suggestion],
      content: message.author.toString(),
      files: attachments,
    });
    await message.delete();

    await sent.react('👍');
    await sent.react('👎');
    await sent.react('<:catshrug:917505035196313671>').catch(() => {
      sent.react('🤷');
    });

    await message.author
      .send({
        content: 'Your suggestion has been sent!',
        embeds: [suggestion],
        files: attachments,
      })
      .catch(() => {});
  }
}
