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

import { isMessageInstance } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';

export class InfoCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: "info",
            description: "Gets info on common anti-vegan arguments",
        });
    }

    // Registers that this is a slash command
    public override registerApplicationCommands(registry: Command.Registry) {
        registry
            .registerChatInputCommand((builder) =>
                builder.setName(this.name).setDescription(this.description)
            )
            .addStringOption((option) =>
                option
                    .setName("argument")
                    .setDescription("The argument you want to learn about")
                    .setRequired(true)
            );
    }

    // Command run
    public async getInfo(interaction: Command.ChatInputInteraction) {
        const argument = interaction.options.getString("argument");
        let argMap = new Map<string, string>([
            [
                "natural",
                "Murder and rape are both natural. Does that mean they are okay?",
            ],
            [
                "but I can",
                "You could also probably kill a baby if you wanted to. Does that make it right?",
            ],
            [
                "resources",
                "Here are some resources compiled in a spreadsheet form! https://vegancheatsheet.org",
            ],
            [
                "personal choice",
                "Is it okay for a killer to kill someone because it was his personal choice?",
            ],
            [
                "I love animals",
                "Would you also say, “I love my children and I also beat them”?",
            ],
            [
                "meat tastes good",
                "Is it morally acceptable for someone to kill a dog if that person likes the taste? \n As a vegan you can still experience all the tastes and consistencies you were used to, with the only difference that they are made of plants.",
            ],
            [
                "animals eat meat",
                "Wild animals also kill each other. Does that mean it’s morally acceptable for people to kill each other?",
            ],
            [
                "tradition",
                "Slavery, racial segregation and the oppression of women were once regarded as a tradition and part of culture. Is that why we should stick to these practices?",
            ],
            [
                "culture",
                "Slavery, racial segregation and the oppression of women were once regarded as a tradition and part of culture. Is that why we should stick to these practices?",
            ],
            [
                "our ancestors ate meat",
                "Eating animals has helped our ancestors to survive. But do we still need to resort to eating meat to survive today?",
            ],
            [
                "cows will overpopulate the world",
                "The world will not become completely vegan overnight, but this will instead be a gradual process over a long period of time.",
            ],
            [
                "humans are more important",
                "We don't need to choose between killing people and animals. Veganism is a way to avoid animal suffering while also improving the lives of humans and your own health.",
            ],
            [
                "plants feel pain",
                "It takes up to 16 kg of plants to produce 1 kg of meat. Additionally, we don't know that for a fact, where we can hear the screams of animals being slaughtered.",
            ],
            [
                "it's the food chain",
                "The food chain exists because of what animals need to do to survive. Do you need to eat animals to survive?\nAdditionally, every cruelty committed by man is based on the illusion of self-assigned power; be it Nazis who believed they were superior to Jews, white people who believed they were superior to black people, or people who believe they are superior to animals.",
            ],
        ]);

        if (argument.length === 0 || !argMap.has(argument)) {
            await interaction.reply({
                content: `Please enter a listed argument!`,
                ephemeral: true,
                fetchReply: true,
            });
        } else {
            await interaction.reply({
                content: `${argMap.get(argument)}`,
                ephemeral: false,
                fetchReply: true,
            });
        }
        return;
    }
}
