# Moderation Commands

## General Moderation

- `/rename <user> <optional: nickname>`/`?ru <user> <optional: nickname>` - Renames that user to the specified nickname,
  if nickname is left blank it will reset the nickname to their original username.
- `/slowmode <duration>`/`?slowmode <duration>` - changes the slowmode for a chat. Duration uses a time which can be set by providing a number 
followed by s/d/m/y or just writing `off`. These can be combined. 
For example to set the slowmode for 1 minute and 30 seconds, you would write: `1m 30s`.
- `/softmute <user>`/`?sm/softmute <user>` - Prevents the user from reacting to messages.
- `/vcmute <user>`/`?vcmute <user>` - Adds a persistent VC mute if the user has left the VC or leaves the server to 
circumvent VC mutes.
- `?warn <user> <reason>` - Gives a warning to the user.

## Roles

These are roles you can give/take away from users.

- `/trusted <user>`/`?t <user>` - Gives/removes the Trusted role from the user.
- `/vegcurious <user>`/`?veg <user>` - Gives/removes the Veg Curious role from the user (only usable on non-vegans).
- `/convinced <user>`/`?conv <user>` - Gives/removes the Convinced role from the user.

## Sus

This command stores notes on users that could be information on the user
or anything that is not serious enough for a warning.

- `/sus add <user> <note>`/`?sus <user> <note>` - Add a note to the user
- `/sus view <user>` - View notes made on the user
- `/sus remove <id>` - Remove a specific note from the sus note id, which you can get from using `/sus view`
- `/sus purge <user>` - Remove all sus notes from the user

## Restrictions

These are used for users that have broken rules severe enough that takes away their access to the server.

- `/restrict <user> <reason>`/`?r/restrict <user> <reason>` - Restricts the user to the restricted section
- `/unrestrict <user>`/`?ur <user>` - Unrestricts the user
- `/restrictlogs <optional: user>` - Shows the logs of when the user has been restricted. The need to provide the user 
is optional depending on if the command is run in the ModMail category.
- `/restricttools channel delete <optional: user>` - Deletes the vegan restricted channel for the user. Providing a user
is only optional if the command is run in the channel that is to be deleted.

## Bans

- `/tempban <user> <duration> <reason>`/`?tempban <user> <duration <reason>` - Bans the user for a specific amount of
time. Duration uses a time which can be set by providing a number followed by s/d/m/y. These can be combined.
For example to ban someone for 1 week and 3 days, you would write: `1w 3d`.
- `/ban <user> <reason>`/`?ban <user> <reason>` - Permanently bans that user.
- `/unban <user>`/`?unban <user>` - Unbans that user.
