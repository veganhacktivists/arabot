# Verifier Commands

## Verification

- `/verify <user> <roles>`/`?ver <user> <roles>` - This is a manual verification to give roles to a user. This should 
not be used if you are verifying the user in the voice channel. Roles available (you can write multiple in one command
such as `v a t`):
  - `v` - Vegan
  - `a` - Activist
  - `t` - Trusted
  - `x` - ARA Vegan (went vegan because of ARA)
  - `nv` - Not Vegan
  - `conv` - Convinced
  - `veg` - Veg Curious

- `/verifytimeoutremove <user>` - Removes a verification timeout if the user has been timed out as a verifier was not 
available. This cannot be used for users that have been verified.

## Roles

These are roles you can give/take away from users.

- `/trusted <user>`/`?t <user>` - Gives/removes the Trusted role from the user.
- `/vegcurious <user>`/`?veg <user>` - Gives/removes the Veg Curious role from the user (only usable on non-vegans).
- `/convinced <user>`/`?conv <user>` - Gives/removes the Convinced role from the user.

### Roles you can only give

- `/vegan <user>`/`?v <user>` - Give the vegan role
- `/activist <user>`/`?a <user>` - Gives the activist role
