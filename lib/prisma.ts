import { PrismaClient, Prisma } from "@prisma/client";

// Define global type for PrismaClient
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Prisma client configuration
const prismaOptions: Prisma.PrismaClientOptions = {
  // Only log errors, disable query logging in development
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
};

// Create PrismaClient singleton
function createPrismaClient() {
  const client = new PrismaClient(prismaOptions);

  // Only add middleware for query timing if VERBOSE_LOGGING is enabled
  if (process.env.VERBOSE_LOGGING === "true") {
    client.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      return result;
    });
  }

  return client;
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

// Test connection on startup
prisma
  .$connect()
  .then(() => console.log("✅ Prisma DB connection established"))
  .catch((e) => console.error("❌ Prisma DB connection failed:", e));

export default prisma;
