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

import { container, Listener } from '@sapphire/framework';
import type {
  VoiceChannel,
  CategoryChannel,
  VoiceState,
  TextChannel,
  GuildMember,
  ColorResolvable,
} from 'discord.js';
import {
  ButtonInteraction,
  Constants,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from 'discord.js';
import { maxVCs } from '../../utils/verificationConfig';
import { joinVerification, startVerification } from '../../utils/database/verification';
import IDs from '../../utils/ids';

class VerificationJoinVCListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'voiceStateUpdate',
    });
  }

  public async run(oldState: VoiceState, newState: VoiceState) {
    // If the event was not a user joining the channel
    if (oldState.channel?.parent?.id === IDs.categories.verification
      || newState.channel?.parent?.id !== IDs.categories.verification
    ) {
      return;
    }

    // Variable if this channel is a Verifiers only VC
    let verifier = false;

    // Checks for not null
    const { channel } = newState;
    const { member } = newState;
    const { client } = container;
    const guild = client.guilds.cache.get(newState.guild.id);

    if (channel === null || member === null || guild === undefined) {
      console.error('Verification channel not found');
      return;
    }

    // Get current category and channel
    const categoryGuild = guild.channels.cache.get(IDs.categories.verification);
    const currentChannelGuild = guild.channels.cache.get(channel.id);
    if (currentChannelGuild === undefined || categoryGuild === undefined) {
      console.error('Verification channel not found');
      return;
    }
    const currentChannel = currentChannelGuild as VoiceChannel;
    const category = categoryGuild as CategoryChannel;

    // Checks if a verifier has joined
    if (channel.members.size === 2) {
      await newState.channel!.permissionOverwrites.set([
        {
          id: guild.roles.everyone,
          allow: ['SEND_MESSAGES'],
        },
      ]);
      return;
    }

    // Check if a verifier joined a verification VC and update database
    if (channel.members.size === 2) {
      if (!channel.name.includes(' - Verification')) {
        return;
      }

      await startVerification(member, channel.id);
      return;
    }

    // Checks if there is more than one person who has joined or if the channel has members
    if (channel.members.size !== 1
      || !channel.members.has(member.id)) {
      return;
    }

    // Check if the user has the verifiers role
    if (member.roles.cache.has(IDs.roles.staff.verifier)
      || member.roles.cache.has(IDs.roles.staff.trialVerifier)) {
      await channel.setName('Verifier Meeting');
      verifier = true;
    } else {
      await channel.setName(`${member.displayName} - Verification`);
      await currentChannel.send(`Hiya ${member.user}, please be patient as a verifier has been called out to verify you.\n\nIf you leave this voice channel, you will automatically be given the non-vegan role where you gain access to this server and if you'd like to verify as a vegan again, you'd have to contact a Mod, which could be done via ModMail.`);
      // Adds to the database that the user joined verification
      await joinVerification(member, channel.id);
    }

    // Check how many voice channels there are
    const listVoiceChannels = category.children.filter((c) => c.type === 'GUILD_VOICE');

    // Create a text channel for verifiers only
    // Checks if there are more than 10 voice channels
    if (!verifier) {
      const verificationText = await guild.channels.create(`✅┃${member.displayName}-verification`, {
        type: 'GUILD_TEXT',
        topic: `Channel for verifiers only. ${member.id} (Please do not change this)`,
        parent: category.id,
        userLimit: 1,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: IDs.roles.verifyBlock,
            deny: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
          },
          {
            id: IDs.roles.staff.verifier,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
        ],
      });

      // Send a message that someone wants to be verified
      await verificationText.send(`${member.user} wants to be verified in ${channel}
      \n<@&${IDs.roles.staff.verifier}> <@&${IDs.roles.staff.trialVerifier}>`);

      await this.verificationProcess(member, verificationText, channel.id);
    }

    // Create a new channel for others to join

    // Checks if there are more than 10 voice channels
    if (listVoiceChannels.size > maxVCs - 1) {
      await guild.channels.create('Verification', {
        type: 'GUILD_VOICE',
        parent: category.id,
        userLimit: 1,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: IDs.roles.verifyBlock,
            deny: ['VIEW_CHANNEL', 'CONNECT', 'SEND_MESSAGES'],
          },
          {
            id: IDs.roles.verifyingAsVegan,
            allow: ['VIEW_CHANNEL'],
            deny: ['CONNECT'],
          },
          {
            id: IDs.roles.staff.verifier,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
        ],
      });
    } else {
      await guild.channels.create('Verification', {
        type: 'GUILD_VOICE',
        parent: category.id,
        userLimit: 1,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: IDs.roles.verifyBlock,
            deny: ['VIEW_CHANNEL', 'CONNECT', 'SEND_MESSAGES'],
          },
          {
            id: IDs.roles.verifyingAsVegan,
            allow: ['VIEW_CHANNEL'],
          },
          {
            id: IDs.roles.staff.verifier,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
        ],
      });
    }

    // Change permissions to join the current channel
    await currentChannel.permissionOverwrites.set([
      {
        id: guild.roles.everyone,
        deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
      },
      {
        id: IDs.roles.verifyingAsVegan,
        deny: ['VIEW_CHANNEL'],
      },
      {
        id: member.id,
        allow: ['VIEW_CHANNEL'],
      },
    ]);
    await currentChannel.setUserLimit(0);
  }

  private async verificationProcess(
    user: GuildMember,
    channel: TextChannel,
    id: string,
  ) {
    const embedColor = '#0099ff';
    const { displayName } = user;
    console.log(displayName); // TODO remove this - literally just used to shut up TypeScript
    let info = {
      page: 0,
      find: {
        reason: 0,
        where: 0,
      },
      length: 0,
      reasoning: 0,
      life: 0,
      food: 0,
      roles: {
        vegan: false,
        activist: false,
        trusted: false,
        vegCurious: false,
        convinced: false,
      },
    };

    // TODO add a variable that tells if each order has a reversed value, e.g. 0-3 or 3-0
    const questionInfo = [
      {
        question: 'Welcome to Animal Rights Advocates! How did you find the server?',
        buttons: [
          'Friend',
          'YouTube',
          'Another Server',
          'Vegan Org',
        ],
      },
      {
        question: 'How long have you been vegan?',
        buttons: [
          '<1 month',
          '1-2 months',
          '3-6 months',
          '6 months – 1 year',
          '1-2 years',
          '2+ years',
        ],
      },
      {
        question: 'Ask the user why they went vegan and to define veganism.\n'
          + 'Do they cite ethical concerns and abstinence from at least meat, dairy, eggs, leather, and fur?',
        buttons: [
          'Yes',
          'Yes with prompting',
          'No',
        ],
      },
      {
        question: 'Ask the user about their life as a vegan, including things like watching documentaries or social media content and interactions with family and friends. What are their stories like?',
        buttons: [
          'Believable',
          'Unbelievable',
          'Short',
        ],
      },
      {
        question: 'Ask the user about food and nutrition. Do they seem to know how to live as a vegan?',
        buttons: [
          'Dietitian / Chef',
          'Acceptable',
          'Salads / Smoothies',
          'No clue',
        ],
      },
    ];

    // Create an embeds for each page
    /*
    const initialEmbed = new MessageEmbed()
      .setColor(embedColor)
      .setTitle(`Do you think ${displayName} is definitely vegan?`);
     */

    const activistEmbed = new MessageEmbed()
      .setColor(embedColor)
      .setTitle('Offer to ask questions for Activist. Do you think they should get it?');

    const noActivistEmbed = new MessageEmbed()
      .setColor(embedColor)
      .setTitle('Do some activism, asking Activist questions. Now which role should they get?');

    /*
    const vegCuriousEmbed = new MessageEmbed()
      .setColor(embedColor)
      .setTitle('Should this user get Veg Curious?');


    // Create buttons to delete or cancel the deletion
    const initialButtons = new MessageActionRow<MessageButton>()
      .addComponents(
        new MessageButton()
          .setCustomId(`yesVegan${id}`)
          .setLabel('Yes')
          .setStyle(Constants.MessageButtonStyles.SUCCESS),
        new MessageButton()
          .setCustomId(`noVegan${id}`)
          .setLabel('No')
          .setStyle(Constants.MessageButtonStyles.DANGER),
      );
     */

    const activistButtons = new MessageActionRow<MessageButton>()
      .addComponents(
        new MessageButton()
          .setCustomId(`yesActivist${id}`)
          .setLabel('Yes')
          .setStyle(Constants.MessageButtonStyles.SUCCESS),
        new MessageButton()
          .setCustomId(`noActivist${id}`)
          .setLabel('No')
          .setStyle(Constants.MessageButtonStyles.DANGER),
      );

    const noActivistButtons = new MessageActionRow<MessageButton>()
      .addComponents(
        new MessageButton()
          .setCustomId(`vegan${id}`)
          .setLabel('Vegan')
          .setStyle(Constants.MessageButtonStyles.SUCCESS),
        new MessageButton()
          .setCustomId(`convinced${id}`)
          .setLabel('Convinced')
          .setStyle(Constants.MessageButtonStyles.SECONDARY),
        new MessageButton()
          .setCustomId(`notVegan${id}`)
          .setLabel('Non-vegan')
          .setStyle(Constants.MessageButtonStyles.DANGER),
      );

    /*
    const vegCuriousButtons = new MessageActionRow<MessageButton>()
      .addComponents(
        new MessageButton()
          .setCustomId(`yesVegCurious${id}`)
          .setLabel('Yes')
          .setStyle(Constants.MessageButtonStyles.SUCCESS),
        new MessageButton()
          .setCustomId(`noVegCurious${id}`)
          .setLabel('No')
          .setStyle(Constants.MessageButtonStyles.DANGER),
      );
     */

    const embed = await this.createEmbed(questionInfo[0].question, embedColor);
    const buttons = await this.createButtons(questionInfo[0].buttons);

    // Sends the note to verify this note is to be deleted
    const message = await channel.send({
      embeds: [embed],
      components: [buttons],
    });

    // Listen for the button presses
    const collector = channel.createMessageComponentCollector({
      max: 2, // Maximum of 1 button press
    });

    // Button pressed
    collector.on('collect', async (button: ButtonInteraction) => {
      // Select roles
      // Definitely vegan?
      if (button.customId === `yesVegan${id}`) {
        await button.deferUpdate();
        info.roles.vegan = true;
        await message.edit({
          embeds: [activistEmbed],
          components: [activistButtons],
        });
      }
      // Not as vegan
      if (button.customId === `noVegan${id}`) {
        await button.deferUpdate();
        await message.edit({
          embeds: [noActivistEmbed],
          components: [noActivistButtons],
        });
      }
    });
  }

  private async createEmbed(title: string, color: ColorResolvable) {
    const embed = new MessageEmbed()
      .setColor(color)
      .setTitle(title);

    return embed;
  }

  private async createButtons(buttons: string[]) {
    const buttonAction = new MessageActionRow<MessageButton>();

    for (let i = 0; i < buttons.length; i += 1) {
      buttonAction
        .addComponents(
          new MessageButton()
            .setCustomId(`button${i}`)
            .setLabel(buttons[i])
            .setStyle(Constants.MessageButtonStyles.SECONDARY),
        );
    }

    return buttonAction;
  }
}

export default VerificationJoinVCListener;
