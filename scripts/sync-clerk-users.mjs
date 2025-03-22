import { Clerk } from "@clerk/clerk-sdk-node";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });
const prisma = new PrismaClient();

async function syncUsers() {
  console.log("Starting Clerk users sync...");

  try {
    // Get all users from Clerk
    const clerkUsers = await clerk.users.getUserList();
    console.log(`Found ${clerkUsers.length} users in Clerk`);

    // Process each user
    for (const clerkUser of clerkUsers) {
      const userId = clerkUser.id;
      const emailAddress = clerkUser.emailAddresses[0]?.emailAddress;

      if (!emailAddress) {
        console.log(`Skipping user ${userId} - no email address found`);
        continue;
      }

      // Check if user exists in database
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (existingUser) {
        console.log(`User ${userId} already exists in database`);
        // Update user if needed
        await prisma.user.update({
          where: { id: userId },
          data: {
            email: emailAddress,
            name: clerkUser.firstName
              ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`
              : "Anonymous User",
          },
        });
        console.log(`Updated user ${userId}`);
      } else {
        // Create new user
        await prisma.user.create({
          data: {
            id: userId,
            email: emailAddress,
            name: clerkUser.firstName
              ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`
              : "Anonymous User",
          },
        });
        console.log(`Created new user ${userId}`);
      }
    }

    console.log("Clerk users sync completed successfully");
  } catch (error) {
    console.error("Error syncing Clerk users:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncUsers();
