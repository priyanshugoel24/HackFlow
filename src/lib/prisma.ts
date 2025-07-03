import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Use a global variable to avoid creating new instances during hot reloads in dev
export const prisma =
  global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;