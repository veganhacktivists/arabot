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
  CategoryChannel,
  ColorResolvable,
  TextChannel,
  VoiceChannel,
  VoiceState,
  GuildMember,
  Guild,
} from 'discord.js';
import {
  ButtonInteraction,
  Constants,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from 'discord.js';
import { time } from '@discordjs/builders';
import { maxVCs, questionInfo, serverFind } from '../../utils/verificationConfig';
import { joinVerification, startVerification, finishVerification } from '../../utils/database/verification';
import { userExists, addExistingUser } from '../../utils/database/dbExistingUser';
import { rolesToString } from '../../utils/formatter';
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

    const roles = rolesToString(member.roles.cache.map((r) => r.id));

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

      await startVerification(channel.id);
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
      await currentChannel.send(`Hiya ${member.user}, please be patient as a verifier has been called out to verify you.\n\n`
      + 'If you leave this voice channel, you will automatically be given the non-vegan role where you gain access to this server and if you\'d like to verify as a vegan again, you\'d have to contact a Mod, which could be done via ModMail.');
      // Adds to the database that the user joined verification
      await joinVerification(channel.id, member);

      // Remove all roles from the user
      await member.roles.remove([
        IDs.roles.vegan.vegan,
        IDs.roles.trusted,
        IDs.roles.nonvegan.nonvegan,
        IDs.roles.nonvegan.convinced,
        IDs.roles.nonvegan.vegCurious,
      ]);
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
      const userInfoEmbed = await this.getUserInfo(member, roles);
      await verificationText.send({
        content: `${member.user} wants to be verified in ${channel}
      \n<@&${IDs.roles.staff.verifier}> <@&${IDs.roles.staff.trialVerifier}>`,
        embeds: [userInfoEmbed],
      });

      await this.verificationProcess(verificationText, channel.id, member, guild);
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
            id: IDs.roles.nonvegan.nonvegan,
            allow: ['VIEW_CHANNEL'],
            deny: ['CONNECT'],
          },
          {
            id: IDs.roles.vegan.vegan,
            allow: ['VIEW_CHANNEL'],
            deny: ['CONNECT'],
          },
          {
            id: IDs.roles.vegan.activist,
            deny: ['VIEW_CHANNEL', 'CONNECT'],
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
            id: IDs.roles.nonvegan.nonvegan,
            allow: ['VIEW_CHANNEL'],
          },
          {
            id: IDs.roles.vegan.vegan,
            allow: ['VIEW_CHANNEL'],
          },
          {
            id: IDs.roles.vegan.activist,
            deny: ['VIEW_CHANNEL', 'CONNECT'],
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
        id: IDs.roles.nonvegan.nonvegan,
        deny: ['VIEW_CHANNEL'],
      },
      {
        id: IDs.roles.vegan.vegan,
        deny: ['VIEW_CHANNEL'],
      },
      {
        id: member.id,
        allow: ['VIEW_CHANNEL'],
      },
    ]);
    await currentChannel.setUserLimit(0);
  }

  // Creates an embed for information about the user
  private async getUserInfo(user: GuildMember, roles: string) {
    const joinTime = time(user.joinedAt!);
    const registerTime = time(user.user.createdAt);

    const embed = new MessageEmbed()
      .setColor(user.displayHexColor)
      .setTitle(`Information on ${user.user.username}`)
      .setThumbnail(user.user.avatarURL()!)
      .addFields(
        { name: 'Joined:', value: `${joinTime}`, inline: true },
        { name: 'Created:', value: `${registerTime}`, inline: true },
        { name: 'Roles:', value: roles },
      );

    return embed;
  }

  private async verificationProcess(
    channel: TextChannel,
    verId: string,
    user: GuildMember,
    guild: Guild,
  ) {
    const embedColor = '#0099ff';
    const info = {
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
    const questionLength = questionInfo.length;

    let embed = await this.createEmbed(questionInfo[0].question, embedColor);
    let buttons = await this.createButtons(questionInfo[0].buttons);

    // Sends the note to verify this note is to be deleted
    const message = await channel.send({
      embeds: [embed],
      components: buttons,
    });

    // Listen for the button presses
    const collector = channel.createMessageComponentCollector({
      // max: 2, // Maximum of 1 button press
    });

    // Button pressed
    collector.on('collect', async (button: ButtonInteraction) => {
      // Select roles
      if (button.customId.includes('button')) {
        await button.deferUpdate();
        // Get the button choice
        const buttonChoice = this.getButtonValue(button.customId);
        if (Number.isNaN(buttonChoice)) {
          return;
        }
        // Set the value of the button choice to the page the question was on
        switch (info.page) {
          case 0: {
            info.find.reason = buttonChoice;
            if (buttonChoice !== 0 && info.find.reason === 0) {
              embed = await this.createEmbed(serverFind[info.page].question, embedColor);
              buttons = await this.createButtons(serverFind[info.page].buttons);
              await message.edit({
                embeds: [embed],
                components: buttons,
              });
              return;
            }
            if (info.find.reason !== 0) {
              info.find.where = buttonChoice;
            }
            break;
          }
          case 1: {
            info.length = buttonChoice;
            break;
          }
          case 2: {
            info.reasoning = buttonChoice;
            break;
          }
          case 3: {
            info.life = buttonChoice;
            break;
          }
          case 4: {
            info.food = buttonChoice;
            break;
          }
          // If they are definitely vegan or not
          case 5: {
            if (buttonChoice === 0) {
              info.roles.vegan = true;
              info.roles.trusted = true;
            } else {
              info.page += 1;
            }
            break;
          }
          // If they are vegan but should get activist role
          case 6: {
            if (buttonChoice === 0) {
              info.roles.activist = true;
            }
            info.page += 1;
            break;
          }
          // If they should get vegan, convinced or non-vegan
          case 7: {
            if (buttonChoice === 0) {
              info.roles.vegan = true;
            } else if (buttonChoice === 1) {
              info.roles.convinced = true;
            }
            break;
          }
          case 8: {
            if (buttonChoice === 0) {
              info.roles.vegCurious = true;
            }
            break;
          }
          default: {
            console.error('Button clicked out of range');
            return;
          }
        }
        info.page += 1;
        // Checks if finished all the questions
        if (info.page < questionLength) {
          embed = await this.createEmbed(questionInfo[info.page].question, embedColor);
          buttons = await this.createButtons(questionInfo[info.page].buttons);
          await message.edit({
            embeds: [embed],
            components: buttons,
          });
        }
        // Confirmation to give roles to the user being verified
        if (info.page === questionLength) {
          // Create embed with all the roles the user has
          embed = new MessageEmbed()
            .setColor(embedColor)
            .setTitle(`Give these roles to ${user.displayName}?`)
            .setThumbnail(user.avatarURL()!)
            .addFields(
              { name: 'Roles:', value: this.getTextRoles(info.roles) },
            );

          // Create buttons for input
          buttons = [new MessageActionRow<MessageButton>()
            .addComponents(
              new MessageButton()
                .setCustomId('confirm')
                .setLabel('Yes')
                .setStyle(Constants.MessageButtonStyles.SUCCESS),
              new MessageButton()
                .setCustomId('cancel')
                .setLabel('No')
                .setStyle(Constants.MessageButtonStyles.DANGER),
            )];
          await message.edit({
            embeds: [embed],
            components: buttons,
          });
        }
      }
      // Confirming and finishing the verification
      if (button.customId === 'confirm' && info.page >= questionLength) {
        // Check verifier is on the database
        const verifierGuildMember = await guild.members.cache.get(button.user.id);
        if (verifierGuildMember === undefined) {
          await message.edit({ content: 'Verifier not found!' });
          return;
        }
        // Add verifier to database if they're not on the database
        if (!(await userExists(verifierGuildMember))) {
          await addExistingUser(verifierGuildMember);
        }

        // Add verification data to database
        await finishVerification(verId, button.user.id, info);
        // Give roles on Discord
        await this.giveRoles(user, info.roles);
        // Add embed saying verification completed
        embed = new MessageEmbed()
          .setColor('#34c000')
          .setTitle(`Successfully verified ${user.displayName}!`)
          .setThumbnail(user.user.avatarURL()!)
          .addFields(
            { name: 'Roles:', value: this.getTextRoles(info.roles) },
          );
        await message.edit({
          embeds: [embed],
          components: [],
        });
      }
    });
  }

  private async createEmbed(title: string, color: ColorResolvable) {
    return new MessageEmbed()
      .setColor(color)
      .setTitle(title);
  }

  private async createButtons(buttons: string[]) {
    const buttonActions = [];

    for (let i = 0; i < buttons.length; i += 1) {
      // Check if it exceeds the maximum buttons in a ActionRow
      if (i % 5 === 0) {
        buttonActions.push(new MessageActionRow<MessageButton>());
      }
      buttonActions[Math.floor(i / 5)]
        .addComponents(
          new MessageButton()
            .setCustomId(`button${i}`)
            .setLabel(buttons[i])
            .setStyle(Constants.MessageButtonStyles.SECONDARY),
        );
    }

    return buttonActions;
  }

  // Finds the value of the choice in the button
  private getButtonValue(button: string) {
    const buttonChoice = button.at(button.length - 1);
    if (buttonChoice === undefined) {
      return NaN;
    }
    return parseInt(buttonChoice, 10);
  }

  private getTextRoles(
    roles: {
      vegan: boolean,
      activist: boolean,
      trusted: boolean,
      vegCurious: boolean,
      convinced: boolean
    },
  ) {
    let rolesText = '';
    if (roles.convinced) {
      rolesText += `<@&${IDs.roles.nonvegan.convinced}>`;
    }
    if (roles.vegan) {
      rolesText += `<@&${IDs.roles.vegan.vegan}>`;
    } else {
      rolesText += `<@&${IDs.roles.nonvegan.nonvegan}>`;
    }
    if (roles.activist) {
      rolesText += `<@&${IDs.roles.vegan.activist}>`;
    }
    if (roles.trusted) {
      rolesText += `<@&${IDs.roles.trusted}>`;
    }
    if (roles.vegCurious) {
      rolesText += `<@&${IDs.roles.nonvegan.vegCurious}>`;
    }
    return rolesText;
  }

  private async giveRoles(
    user: GuildMember,
    roles: {
      vegan: boolean,
      activist: boolean,
      trusted: boolean,
      vegCurious: boolean,
      convinced: boolean
    },
  ) {
    const rolesAdd = [];
    if (roles.convinced) {
      rolesAdd.push(IDs.roles.nonvegan.convinced);
    }
    if (roles.vegan) {
      rolesAdd.push(IDs.roles.vegan.vegan);
    } else {
      rolesAdd.push(IDs.roles.nonvegan.nonvegan);
    }
    if (roles.activist) {
      rolesAdd.push(IDs.roles.vegan.activist);
    }
    if (roles.trusted) {
      rolesAdd.push(IDs.roles.trusted);
    }
    if (roles.vegCurious) {
      rolesAdd.push(IDs.roles.nonvegan.vegCurious);
    }
    await user.roles.add(rolesAdd);
  }
}

export default VerificationJoinVCListener;
