import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Initialize Prisma client
const prisma = new PrismaClient();

// Environment variable to disable verification (for testing)
const DISABLE_WEBHOOK_VERIFICATION =
  process.env.DISABLE_WEBHOOK_VERIFICATION === "true";

// Define a type for the user data from Clerk
interface ClerkUserData {
  id: string;
  email_addresses: Array<{ email_address: string }>;
  first_name: string;
  last_name: string;
  [key: string]: unknown; // Allow other fields with unknown type
}

export async function POST(req: Request) {
  console.log("Webhook endpoint called");

  try {
    // Get the raw body as text
    const rawBody = await req.text();
    console.log("Raw body received, length:", rawBody.length);

    // Parse the JSON data
    let jsonData;
    try {
      jsonData = JSON.parse(rawBody);
      console.log("Event type from payload:", jsonData.type);
    } catch (err) {
      console.error("Error parsing webhook body:", err);
      return new Response("Invalid JSON payload", { status: 400 });
    }

    // For testing or if verification is disabled, process the webhook directly
    if (DISABLE_WEBHOOK_VERIFICATION) {
      console.log("Webhook verification disabled. Processing data directly...");

      // Process user creation/update directly from the payload
      if (
        jsonData.type === "user.created" ||
        jsonData.type === "user.updated"
      ) {
        return await processUserData(jsonData.data as unknown as ClerkUserData);
      }

      // For other event types, just return success
      return NextResponse.json({
        status: "success",
        message: "Webhook received (verification disabled)",
      });
    }

    // If verification is enabled, proceed with normal verification flow
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      console.error("Missing CLERK_WEBHOOK_SECRET env variable");
      return new Response("Missing webhook secret", { status: 500 });
    }

    // Get the request headers
    const svix_id = req.headers.get("svix-id");
    const svix_timestamp = req.headers.get("svix-timestamp");
    const svix_signature = req.headers.get("svix-signature");

    console.log("Webhook headers:", {
      svix_id_exists: !!svix_id,
      svix_timestamp_exists: !!svix_timestamp,
      svix_signature_exists: !!svix_signature,
    });

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("Missing svix headers");
      return new Response("Missing svix headers", { status: 400 });
    }

    // Create webhook instance and verify
    let event: WebhookEvent;
    try {
      console.log(
        "Attempting to verify webhook with secret starting with:",
        WEBHOOK_SECRET.substring(0, 5) + "..."
      );

      const webhook = new Webhook(WEBHOOK_SECRET);
      event = webhook.verify(rawBody, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;

      console.log("Webhook verified successfully");
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response(
        `Error verifying webhook: ${
          err instanceof Error ? err.message : String(err)
        }`,
        { status: 400 }
      );
    }

    // Handle the webhook event
    const eventType = event.type;
    console.log(`Webhook received and verified: ${eventType}`);

    if (eventType === "user.created" || eventType === "user.updated") {
      return await processUserData(event.data as unknown as ClerkUserData);
    }

    // Return a success response for other webhook types
    return NextResponse.json({
      status: "success",
      message: "Webhook received and processed",
    });
  } catch (error) {
    console.error("Unhandled webhook error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Unhandled error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Helper function to process user data
async function processUserData(userData: ClerkUserData) {
  const { id, email_addresses, first_name, last_name } = userData;
  const emailAddress = email_addresses?.[0]?.email_address;

  console.log("Processing user data:", {
    id,
    hasEmail: !!emailAddress,
    firstName: first_name,
    lastName: last_name,
  });

  if (!emailAddress) {
    console.log(`Skipping user ${id} - no email address found`);
    return NextResponse.json({
      status: "skipped",
      reason: "No email address",
    });
  }

  try {
    // Check if user exists
    console.log(`Checking if user ${id} exists in database`);
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (existingUser) {
      console.log(`User ${id} exists, updating...`);
      // Update user
      await prisma.user.update({
        where: { id },
        data: {
          email: emailAddress,
          name: first_name
            ? `${first_name} ${last_name || ""}`
            : "Anonymous User",
        },
      });
      console.log(`Updated user ${id} in database`);
      return NextResponse.json({ status: "success", action: "updated" });
    } else {
      console.log(`User ${id} does not exist, creating...`);
      // Create user
      await prisma.user.create({
        data: {
          id,
          email: emailAddress,
          name: first_name
            ? `${first_name} ${last_name || ""}`
            : "Anonymous User",
        },
      });
      console.log(`Created user ${id} in database`);
      return NextResponse.json({ status: "success", action: "created" });
    }
  } catch (error) {
    console.error("Error syncing user to database:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Database error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
