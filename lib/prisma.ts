import { PrismaClient } from "@prisma/client";

// Define global type
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;
