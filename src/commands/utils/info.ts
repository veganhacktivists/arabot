// SPDX-License-Identifier: GPL-3.0-or-later
/*
  Animal Rights Advocates Discord Bot
  Copyright (C) 2022  Anthony Berg, Kate Fort

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

import { Command } from '@sapphire/framework';

class InfoCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'info',
      description: 'Gets info on common anti-vegan arguments',
    });
  }

  // Registers that this is a slash command
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) => builder
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) => option
        .setName('argument')
        .setDescription('The argument you want to learn more about')
        .setRequired(true)
        .addChoices(
          {
            name: 'natural',
            value: 'Murder and rape are both natural. Does that mean they are okay?',
          },
          {
            name: 'but I can',
            value: 'You could also probably kill a baby if you wanted to. Does that make it right?',
          },
          {
            name: 'resources',
            value: 'Here are some resources compiled in a spreadsheet form! https://vegancheatsheet.org',
          },
          {
            name: 'personal choice',
            value: 'Is it okay for a killer to kill someone because it was his personal choice?',
          },
          {
            name: 'I love animals',
            value: 'Would you also say, “I love my children and I also beat them”?',
          },
          {
            name: 'meat tastes good',
            value: 'Is it morally acceptable for someone to kill a dog if that person likes the taste? \n As a vegan you can still experience all the tastes and consistencies you were used to, with the only difference that they are made of plants.',
          },
          {
            name: 'animals eat meat',
            value: 'Wild animals also kill each other. Does that mean it\'s morally acceptable for people to kill each other?',
          },
          {
            name: 'it\'s my tradition',
            value: 'Slavery, racial segregation and the oppression of women were once regarded as a tradition and part of culture. Is that why we should stick to these practices?',
          },
          {
            name: 'it\'s my culture',
            value: 'Slavery, racial segregation and the oppression of women were once regarded as a tradition and part of culture. Is that why we should stick to these practices?',
          },
          {
            name: 'our ancestors ate meat',
            value: 'Eating animals has helped our ancestors to survive. But do we still need to resort to eating meat to survive today?',
          },
          {
            name: 'cows will overpopulate the world',
            value: 'The world will not become completely vegan overnight, but this will instead be a gradual process over a long period of time.',
          },
          {
            name: 'humans are more important',
            value: "We don't need to choose between killing people and animals. Veganism is a way to avoid animal suffering while also improving the lives of humans and your own health.",
          },
          {
            name: 'plants feel pain',
            value: "It takes up to 16 kg of plants to produce 1 kg of meat. Additionally, we don't know that for a fact, where we can hear the screams of animals being slaughtered.",
          },
          {
            name: "it's the food chain",
            value: 'The food chain exists because of what animals need to do to surive. Do you need to eat animals to survive?\nAdditionally, every cruelty committed by man is based on the illusion of self-assigned power; be it Nazis who believed they were superior to Jews, white people who believed they were superior to black people, or people who believe they are superior to animals.',
          },
        )));
  }

  // Command run
  public static async getInfo(interaction: Command.ChatInputInteraction) {
    const response = interaction.options.getString('argument');
    if (response === null) {
      await interaction.reply({
        content:
          'Please choose a listed argument, or talk to an activist for further questions!',
        ephemeral: true,
        fetchReply: true,
      });
    } else {
      await interaction.reply({
        content: `${response}`,
        ephemeral: false,
        fetchReply: true,
      });
    }
  }
}
export default InfoCommand;
