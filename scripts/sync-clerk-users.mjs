import { clerkClient } from "@clerk/clerk-sdk-node";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

// No need to initialize with secretKey as it uses the env variable automatically
const prisma = new PrismaClient();

/**
 * Synchronizes user data from Clerk to the database.
 *
 * This asynchronous function retrieves users from the Clerk service and ensures that each user is
 * accurately represented in the database. For each user, it will either update the existing record with
 * the latest email and name information or create a new entry if the user is not found. Users without a
 * valid email address are skipped.
 *
 * In the event of an error during synchronization, the error is logged and the process terminates with
 * a status code of 1. The function also guarantees that the database connection is properly closed upon
 * completion.
 *
 * @async
 * @returns {Promise<void>}
 *
 * @remark Missing first names are handled by assigning "Anonymous User" as the default name.
 */
async function syncUsers() {
  console.log("Starting Clerk users sync...");

  try {
    // Get all users from Clerk
    const { data: clerkUsers } = await clerkClient.users.getUserList();
    console.log(`Found ${clerkUsers?.length || 0} users in Clerk`);

    // Process each user
    for (const clerkUser of clerkUsers || []) {
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
