import { container } from '@sapphire/framework';
import { Prisma } from '@prisma/client';

export async function addSusNoteDB(
  userId: string,
  modId: string,
  message: string,
) {
  // Add the user to the database
  await container.database.sus.create({
    data: {
      user: {
        connectOrCreate: {
          where: {
            id: userId,
          },
          create: {
            id: userId,
          },
        },
      },
      mod: {
        connectOrCreate: {
          where: {
            id: modId,
          },
          create: {
            id: modId,
          },
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
    orderBy: {
      id: 'asc',
    },
  });

  return note;
}

export type SusNotes = Prisma.PromiseReturnType<typeof findNotes>;

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
