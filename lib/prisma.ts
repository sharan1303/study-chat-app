import { PrismaClient, Prisma } from "@prisma/client";

// Define global type for PrismaClient
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Prisma client configuration
const prismaOptions: Prisma.PrismaClientOptions = {
  log:
    process.env.NODE_ENV === "development"
      ? (["error", "warn"] as Prisma.LogLevel[])
      : (["error"] as Prisma.LogLevel[]),
};

// Create PrismaClient singleton
function createPrismaClient() {
  return new PrismaClient(prismaOptions);
}

// Use a single instance of Prisma Client in development
// In production (Vercel), each serverless function will get its own instance
// but connection pooling at the database level will be efficient
let prisma: PrismaClient;

// In development, we attach to the global object to prevent multiple instances
if (process.env.NODE_ENV === "development") {
  if (!global.prisma) {
    global.prisma = createPrismaClient();
  }
  prisma = global.prisma;
} else {
  // In production, create a new client for each serverless function
  // Connection pooling will handle the efficiency
  prisma = createPrismaClient();
}

export default prisma;
