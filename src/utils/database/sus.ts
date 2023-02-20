import { container } from '@sapphire/framework';

export async function addToDatabase(userId: string, modId: string, message: string) {
  // Add the user to the database
  await container.database.sus.create({
    data: {
      user: {
        connect: {
          id: userId,
        },
      },
      mod: {
        connect: {
          id: modId,
        },
      },
      note: message,
    },
  });
}

// Get a list of sus notes from the user
export async function findNotes(userId: string, active: boolean) {
  // Query to get the specific user's sus notes
  const note = await container.database.sus.findMany({
    where: {
      userId,
      active,
    },
    orderBy:
      {
        id: 'asc',
      },
  });

  return note;
}

// Get one note from the id
export async function getNote(noteId: number) {
  // Query to get the specific user's sus notes
  const note = await container.database.sus.findUnique({
    where: {
      id: noteId,
    },
  });

  return note;
}

export async function deactivateNote(noteId: number) {
  // Query to deactivate the specific sus note
  await container.database.sus.update({
    where: {
      id: noteId,
    },
    data: {
      active: false,
    },
  });
}

export async function deactivateAllNotes(userId: string) {
  // Query to deactivate the specific user's sus notes
  await container.database.sus.updateMany({
    where: {
      userId: {
        contains: userId,
      },
    },
    data: {
      active: false,
    },
  });
}
