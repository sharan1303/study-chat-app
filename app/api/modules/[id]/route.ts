import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { broadcastModuleUpdated, broadcastModuleDeleted } from "@/lib/events";

// GET /api/modules/[id] - Get a specific module by ID
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    const moduleId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");

    if (!moduleId) {
      return NextResponse.json(
        { error: "Module ID is required" },
        { status: 400 }
      );
    }

    // Build the query conditions to find the module
    const whereCondition = {
      id: moduleId,
    };

    // Add user or session filter
    if (userId) {
      // @ts-expect-error - Dynamic property assignment
      whereCondition.userId = userId;
    } else if (sessionId) {
      // @ts-expect-error - Dynamic property assignment
      whereCondition.sessionId = sessionId;
    } else {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find the module
    const moduleData = await prisma.module.findFirst({
      where: whereCondition,
    });

    if (!moduleData) {
      return NextResponse.json(
        { error: "Module not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(moduleData);
  } catch (error) {
    console.error("Error fetching module:", error);
    return NextResponse.json(
      { error: "Failed to fetch module" },
      { status: 500 }
    );
  }
}

// PUT /api/modules/[id] - Update a module
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");
    const moduleId = params.id;
    const { name, description, icon } = await request.json();

    if (!moduleId) {
      return NextResponse.json(
        { error: "Module ID is required" },
        { status: 400 }
      );
    }

    // Either userId or sessionId must be provided
    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Build the where clause
    const whereCondition = {
      id: moduleId,
    };

    // Add user or session filter
    if (userId) {
      // @ts-expect-error - Dynamic property assignment
      whereCondition.userId = userId;
    } else if (sessionId) {
      // @ts-expect-error - Dynamic property assignment
      whereCondition.sessionId = sessionId;
    }

    // Check if the module exists and belongs to the user
    const existingModule = await prisma.module.findFirst({
      where: whereCondition,
    });

    if (!existingModule) {
      return NextResponse.json(
        { error: "Module not found or access denied" },
        { status: 404 }
      );
    }

    // Update the module
    const updatedModule = await prisma.module.update({
      where: { id: moduleId },
      data: {
        name: name !== undefined ? name : existingModule.name,
        description:
          description !== undefined ? description : existingModule.description,
        icon: icon !== undefined ? icon : existingModule.icon,
      },
    });

    // Broadcast event for real-time updates
    broadcastModuleUpdated(updatedModule, [userId || sessionId]);

    return NextResponse.json(updatedModule);
  } catch (error) {
    console.error("Error updating module:", error);

    // Handle duplicate module name error
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A module with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update module" },
      { status: 500 }
    );
  }
}

// DELETE /api/modules/[id] - Delete a module
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");
    const moduleId = params.id;

    if (!moduleId) {
      return NextResponse.json(
        { error: "Module ID is required" },
        { status: 400 }
      );
    }

    // Either userId or sessionId must be provided
    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Build the where clause
    const whereCondition = {
      id: moduleId,
    };

    // Add user or session filter
    if (userId) {
      // @ts-expect-error - Dynamic property assignment
      whereCondition.userId = userId;
    } else if (sessionId) {
      // @ts-expect-error - Dynamic property assignment
      whereCondition.sessionId = sessionId;
    }

    // Check if the module exists and belongs to the user
    const existingModule = await prisma.module.findFirst({
      where: whereCondition,
    });

    if (!existingModule) {
      return NextResponse.json(
        { error: "Module not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the module
    await prisma.module.delete({
      where: { id: moduleId },
    });

    // Broadcast event for real-time updates
    broadcastModuleDeleted(moduleId, [userId || sessionId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting module:", error);
    return NextResponse.json(
      { error: "Failed to delete module" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
