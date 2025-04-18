import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { broadcastDataMigrated } from "@/lib/events";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  try {
    // Get the sessionId from the request body
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      console.error(
        "API: Missing sessionId in request to migrate-anonymous-data"
      );
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // If no userId was provided by auth, check if it was passed in the request body
    // or get it from the request headers (for development/testing purposes)
    const effectiveUserId = userId || body.userId;

    if (!effectiveUserId) {
      console.error(
        "API: Cannot migrate data - no user ID available. SessionId:",
        sessionId?.substring(0, 8)
      );
      return NextResponse.json(
        { error: "User ID is required for migration" },
        { status: 400 }
      );
    }


    // Start a transaction to ensure data integrity
    const result = await prisma.$transaction(async (prismaClient) => {
      // 1. Find all modules with this sessionId
      const modules = await prismaClient.module.findMany({
        where: { sessionId },
        include: { resources: true },
      });

      // 2. Update all modules to associate them with the user
      let migratedModules = 0;
      if (modules.length > 0) {
        await prismaClient.module.updateMany({
          where: { sessionId },
          data: {
            userId: effectiveUserId,
            sessionId: "", // Empty string instead of null
          },
        });
        migratedModules = modules.length;
      }

      // 3. Find all resources with this sessionId (that weren't already included with modules)
      const orphanedResources = await prismaClient.resource.findMany({
        where: {
          moduleId: { equals: undefined }, // Using equals for null check
        },
      });

      // 4. Update all resources to associate them with the user
      let migratedResources = 0;
      if (orphanedResources.length > 0) {
        await prismaClient.resource.updateMany({
          where: {
            moduleId: { equals: undefined }, // Using equals for null check
          },
          data: {
            userId: effectiveUserId,
          },
        });
        migratedResources = orphanedResources.length;
      }
      
      // 6. Find and migrate all chats associated with this sessionId
      const chats = await prismaClient.chat.findMany({
        where: { sessionId },
      });

      let migratedChats = 0;
      if (chats.length > 0) {
        await prismaClient.chat.updateMany({
          where: { sessionId },
          data: {
            userId: effectiveUserId,
            sessionId: "", // Empty string instead of null
          },
        });
        migratedChats = chats.length;
      }

      return { migratedModules, migratedResources, migratedChats };
    });

    // Broadcast a data migration event
    broadcastDataMigrated(
      { userId: effectiveUserId, sessionId, id: effectiveUserId },
      [effectiveUserId, sessionId]
    );

    console.log(
      `API: Successfully migrated anonymous data for sessionId=${sessionId.substring(
        0,
        8
      )}... to userId=${effectiveUserId.substring(0, 8)}...`
    );

    return NextResponse.json({
      success: true,
      migrated: {
        modules: result.migratedModules,
        resources: result.migratedResources,
        chats: result.migratedChats,
      },
    });
  } catch (error) {
    console.error("API: Error migrating anonymous data:", error);

    // Include more detailed error information
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: "Failed to migrate anonymous data",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

// Add this export to tell Next.js that this route should be treated as dynamic
export const dynamic = "force-dynamic";
