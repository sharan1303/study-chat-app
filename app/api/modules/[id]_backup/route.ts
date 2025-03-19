import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET /api/modules/[id] - Get module details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  const moduleId = params.id;

  try {
    // Build the where clause
    const where: any = {
      id: moduleId,
    };

    // If both userId and sessionId are missing, return unauthorized
    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Add either userId or sessionId to the where clause
    if (userId) {
      where.userId = userId;
    } else if (sessionId) {
      where.sessionId = sessionId;
    }

    // Fetch the module
    const module = await prisma.module.findFirst({
      where,
      include: {
        resources: true,
        _count: {
          select: { resources: true },
        },
      },
    });

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Format the module for the response
    const formattedModule = {
      id: module.id,
      name: module.name,
      description: module.description,
      icon: module.icon,
      resourceCount: module._count.resources,
      createdAt: module.createdAt.toISOString(),
      updatedAt: module.updatedAt.toISOString(),
      resources: module.resources.map((resource) => ({
        id: resource.id,
        title: resource.title || "",
        description: resource.content || "",
        type: resource.type,
        url: resource.fileUrl,
        moduleId: resource.moduleId,
        createdAt: resource.createdAt.toISOString(),
        updatedAt: resource.updatedAt.toISOString(),
      })),
    };

    return NextResponse.json(formattedModule);
  } catch (error) {
    console.error("Error fetching module:", error);
    return NextResponse.json(
      { error: "Failed to fetch module" },
      { status: 500 }
    );
  }
}

// PUT /api/modules/[id] - Update module
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  const moduleId = params.id;

  // Either userId or sessionId must be provided
  if (!userId && !sessionId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { name, description, icon } = await request.json();

    // Build the where clause
    const where: any = {
      id: moduleId,
    };

    // Add either userId or sessionId to the where clause
    if (userId) {
      where.userId = userId;
    } else if (sessionId) {
      where.sessionId = sessionId;
    }

    // Check if the module exists and belongs to the user or session
    const existingModule = await prisma.module.findFirst({
      where,
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
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(icon ? { icon } : {}),
      },
    });

    return NextResponse.json(updatedModule);
  } catch (error: any) {
    // Handle duplicate module name error
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A module with this name already exists" },
        { status: 400 }
      );
    }

    console.error("Error updating module:", error);
    return NextResponse.json(
      { error: "Failed to update module" },
      { status: 500 }
    );
  }
}

// DELETE /api/modules/[id] - Delete module
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  const moduleId = params.id;

  // Either userId or sessionId must be provided
  if (!userId && !sessionId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Build the where clause
    const where: any = {
      id: moduleId,
    };

    // Add either userId or sessionId to the where clause
    if (userId) {
      where.userId = userId;
    } else if (sessionId) {
      where.sessionId = sessionId;
    }

    // Check if the module exists and belongs to the user or session
    const existingModule = await prisma.module.findFirst({
      where,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting module:", error);
    return NextResponse.json(
      { error: "Failed to delete module" },
      { status: 500 }
    );
  }
}
