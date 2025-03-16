import { PrismaClient } from "@prisma/client";

// Define global type
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// PrismaClient initialization with proper logging
function getPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const prisma = global.prisma || getPrismaClient();

// In development, keep the connection alive
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;
