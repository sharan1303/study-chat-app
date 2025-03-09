// Test script to check database connection
import PrismaClient from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Testing database connection...");

    // Test connection by querying users
    const users = await prisma.user.findMany();
    console.log("Connection successful!");
    console.log(`Found ${users.length} users in the database`);

    // Test connection by querying modules
    const modules = await prisma.module.findMany();
    console.log(`Found ${modules.length} modules in the database`);

    // Create a test user if none exists
    if (users.length === 0) {
      console.log("Creating a test user...");
      const testUser = await prisma.user.create({
        data: {
          id: "test-user-id",
          email: "test@example.com",
          name: "Test User",
        },
      });
      console.log("Test user created:", testUser);
    }
  } catch (error) {
    console.error("Database connection error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
