import { PrismaClient } from '@prisma/client';

export async function addToDatabase(userId: string, modId: string, message: string) {
  // Initialise the database connection
  const prisma = new PrismaClient();

  // Add the user to the database
  await prisma.sus.create({
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

  // Close the database connection
  await prisma.$disconnect();
}

// Get a list of sus notes from the user
export async function findNotes(userId: string, active: boolean) {
  // Initialise the database connection
  const prisma = new PrismaClient();

  // Query to get the specific user's sus notes
  const note = await prisma.sus.findMany({
    where: {
      userId,
      active,
    },
  });

  // Close the database connection
  await prisma.$disconnect();
  return note;
}

// Get one note from the id
export async function getNote(noteId: number) {
  // Initialise the database connection
  const prisma = new PrismaClient();

  // Query to get the specific user's sus notes
  const note = await prisma.sus.findUnique({
    where: {
      id: noteId,
    },
  });

  // Close the database connection
  await prisma.$disconnect();
  return note;
}

export async function deactivateNote(noteId: number) {
  // Initialise the database connection
  const prisma = new PrismaClient();

  // Query to deactivate the specific sus note
  await prisma.sus.update({
    where: {
      id: noteId,
    },
    data: {
      active: false,
    },
  });

  // Close the database connection
  await prisma.$disconnect();
}

export async function deactivateAllNotes(userId: string) {
  // Initialise the database connection
  const prisma = new PrismaClient();

  // Query to deactivate the specific user's sus notes
  await prisma.sus.updateMany({
    where: {
      userId: {
        contains: userId,
      },
    },
    data: {
      active: false,
    },
  });

  // Close the database connection
  await prisma.$disconnect();
}
