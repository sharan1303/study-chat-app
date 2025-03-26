import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  // Require authentication
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the sessionId from the request body
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
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
            userId,
            sessionId: "", // Empty string instead of null
          },
        });
        migratedModules = modules.length;
      }

      // 3. Find all resources with this sessionId (that weren't already included with modules)
      const orphanedResources = await prismaClient.resource.findMany({
        where: {
          sessionId,
          moduleId: { equals: undefined }, // Using equals for null check
        },
      });

      // 4. Update all resources to associate them with the user
      let migratedResources = 0;
      if (orphanedResources.length > 0) {
        await prismaClient.resource.updateMany({
          where: {
            sessionId,
            moduleId: { equals: undefined }, // Using equals for null check
          },
          data: {
            userId,
            sessionId: "", // Empty string instead of null
          },
        });
        migratedResources = orphanedResources.length;
      }

      // 5. Also update any resources directly associated with the sessionId
      const directResources = await prismaClient.resource.findMany({
        where: { sessionId },
      });

      if (directResources.length > 0) {
        await prismaClient.resource.updateMany({
          where: { sessionId },
          data: {
            userId,
            sessionId: "", // Empty string instead of null
          },
        });
        migratedResources += directResources.length;
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
            userId,
            sessionId: "", // Empty string instead of null
          },
        });
        migratedChats = chats.length;
      }

      return { migratedModules, migratedResources, migratedChats };
    });

    return NextResponse.json({
      success: true,
      migrated: {
        modules: result.migratedModules,
        resources: result.migratedResources,
        chats: result.migratedChats,
      },
    });
  } catch (error) {
    console.error("Error migrating anonymous data:", error);
    return NextResponse.json(
      { error: "Failed to migrate anonymous data" },
      { status: 500 }
    );
  }
}

// Add this export to tell Next.js that this route should be treated as dynamic
export const dynamic = "force-dynamic";
