# Coordinator Commands

## General Coordinator Commands

- `/access <permission> <channel> <user/role>` - Gives/removes specific access to a user/role from a channel in
  ModMail/Private/Restricted categories.
- `/anonymous <message> <optional: channel>`/`?anon <channel> <message>` - Sends a message via the bot (optionally if
  channel has been defined, to that channel).
- `/clear <messages>`/`?clear <messages>` - Bulk deletes 1-100 messages.
- `/moveall <channel>`/`?mvall <channel>` - Moves everyone in the current voice channel to the specified voice channel.
- `/plus <user>`/`?plus <user>` - Gives/removes the Plus role from the user. This role is for members that are 18+.

## Private Channels

- `/private create <user>` - Creates a private channel for that user for the specific coordinator team you are on.
- `/private delete <optional: user>` - Deletes the private channel, either the channel you are currently in or if
  specified the optional channel, the channel you declared. You can only delete your specific coordinator team's private
  channels.

## Diversity Team

- `/diversity <user>`/`?div <user>` - Gives/removes the Diversity Team role from the user.
- `/diversity toggleopen` - toggles the diversity chat open or closed.

## Events Team

- `/stagehost <user>`/`?stagehost <user>` - Gives/removes the Stage Host role from the user.
- `/bookclub <user>`/`?bookclub <user>` - Gives/removes the Book Club role from the user.
- `/debatehost <user>`/`?debatehost <user>` - Gives/removes the Debate Host role from the user.
- `/gamenight <user>`/`?gamenight <user>` - Gives/removes the Game Night Host role from the user.
- `/guest <user>`/`?guest <user>` - Gives/removes the Guest role from the user.

## Mentor Team

- `/mentor <user>`/`?mentor <user>` - Gives/removes the Mentor role from the user.

## Verification Team

- `/vegan <user>`/`?v <user>` - Gives/removes the Vegan role from the user.
- `/activist <user>`/`?a <user>` - Gives/removes the Activist role from the user.
- `/verifier <user>`/`?verifier <user>` - Gives/removes the Verifier role from the user.
- `/trialverifier <user>`/`?trialverifier <user>` - Gives/removes the Trial Verifier role from the user.

## Mod Team

- `/mod <user>`/`?mod <user>` - Gives/removes the Mod role from the user.
- `/restrictedaccess <user>`/`?ra <user>` - Gives/removes the Restricted Access role from the user.
