import { PrismaClient, Prisma } from "@prisma/client";

// Define global type
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// PrismaClient initialization with proper logging
function getPrismaClient() {
  const prismaOptions: Prisma.PrismaClientOptions = {
    log:
      process.env.NODE_ENV === "development"
        ? (["query", "error", "warn"] as Prisma.LogLevel[])
        : (["error"] as Prisma.LogLevel[]),
  };

  try {
    console.log("Initializing Prisma client");
    return new PrismaClient(prismaOptions);
  } catch (error) {
    console.error("Error initializing Prisma client:", error);
    // Fallback with delay
    console.log("Retrying Prisma client initialization...");
    return new PrismaClient(prismaOptions);
  }
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = getPrismaClient();
} else {
  // In development, keep the connection alive between hot reloads
  if (!global.prisma) {
    global.prisma = getPrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
