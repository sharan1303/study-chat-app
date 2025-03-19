import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get sessionId from request body
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Start transaction to ensure all data is migrated or nothing is
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update all modules from session to user
      const updatedModules = await tx.module.updateMany({
        where: {
          sessionId: sessionId,
        } as Prisma.ModuleWhereInput,
        data: {
          userId: userId,
          sessionId: null,
        } as Prisma.ModuleUpdateManyMutationInput,
      });

      // 2. Update all resources from session to user
      const updatedResources = await tx.resource.updateMany({
        where: {
          sessionId: sessionId,
        } as Prisma.ResourceWhereInput,
        data: {
          userId: userId,
          sessionId: null,
        } as Prisma.ResourceUpdateManyMutationInput,
      });

      return {
        modules: updatedModules.count,
        resources: updatedResources.count,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Anonymous data migrated successfully",
      migrated: result,
    });
  } catch (error) {
    console.error("Error migrating anonymous data:", error);
    return NextResponse.json(
      { error: "Failed to migrate anonymous data" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
