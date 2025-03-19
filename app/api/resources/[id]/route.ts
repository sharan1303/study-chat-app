import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// Add this export to tell Next.js that this route should be treated as dynamic
export const dynamic = "force-dynamic";

// GET /api/resources/[id] - Get resource details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  const resourceId = params.id;

  // Either userId or sessionId must be provided
  if (!userId && !sessionId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Build the module where clause
    const moduleWhere: Record<string, unknown> = {};

    if (userId) {
      moduleWhere.userId = userId;
    } else if (sessionId) {
      moduleWhere.sessionId = sessionId;
    }

    // Fetch the resource with ownership check
    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        module: moduleWhere,
      },
      include: {
        module: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 }
      );
    }

    // Format the resource for the response
    const formattedResource = {
      id: resource.id,
      title: resource.title || "",
      description: resource.content || "",
      type: resource.type,
      url: resource.fileUrl,
      moduleId: resource.moduleId,
      moduleName: resource.module?.name || null,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
    };

    return NextResponse.json(formattedResource);
  } catch (error) {
    console.error("Error fetching resource:", error);
    return NextResponse.json(
      { error: "Failed to fetch resource" },
      { status: 500 }
    );
  }
}

// PUT /api/resources/[id] - Update resource
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  const resourceId = params.id;

  // Either userId or sessionId must be provided
  if (!userId && !sessionId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Build the module where clause
    const moduleWhere: Record<string, unknown> = {};

    if (userId) {
      moduleWhere.userId = userId;
    } else if (sessionId) {
      moduleWhere.sessionId = sessionId;
    }

    // Check if the resource exists and belongs to the user or session
    const existingResource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        module: moduleWhere,
      },
      include: {
        module: true,
      },
    });

    if (!existingResource) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 }
      );
    }

    const { title, description, type, url, moduleId } = await request.json();

    // If moduleId is changing, verify user/session has access to the target module
    if (moduleId && moduleId !== existingResource.moduleId) {
      const targetModuleWhere: Record<string, unknown> = {
        id: moduleId,
      };

      if (userId) {
        targetModuleWhere.userId = userId;
      } else if (sessionId) {
        targetModuleWhere.sessionId = sessionId;
      }

      const targetModule = await prisma.module.findFirst({
        where: targetModuleWhere,
      });

      if (!targetModule) {
        return NextResponse.json(
          { error: "Target module not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Update the resource
    const updatedResource = await prisma.resource.update({
      where: { id: resourceId },
      data: {
        ...(title ? { title } : {}),
        ...(description !== undefined ? { content: description } : {}),
        ...(type ? { type } : {}),
        ...(url !== undefined ? { fileUrl: url } : {}),
        ...(moduleId ? { moduleId } : {}),
      },
      include: {
        module: {
          select: {
            name: true,
          },
        },
      },
    });

    // Format the response
    const formattedResource = {
      id: updatedResource.id,
      title: updatedResource.title || "",
      description: updatedResource.content || "",
      type: updatedResource.type,
      url: updatedResource.fileUrl,
      moduleId: updatedResource.moduleId,
      moduleName: updatedResource.module?.name || null,
      createdAt: updatedResource.createdAt.toISOString(),
      updatedAt: updatedResource.updatedAt.toISOString(),
    };

    return NextResponse.json(formattedResource);
  } catch (error) {
    console.error("Error updating resource:", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    );
  }
}

// DELETE /api/resources/[id] - Delete resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  const resourceId = params.id;

  // Either userId or sessionId must be provided
  if (!userId && !sessionId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Build the module where clause
    const moduleWhere: Record<string, unknown> = {};

    if (userId) {
      moduleWhere.userId = userId;
    } else if (sessionId) {
      moduleWhere.sessionId = sessionId;
    }

    // Check if the resource exists and belongs to the user or session
    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        module: moduleWhere,
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the resource
    await prisma.resource.delete({
      where: { id: resourceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting resource:", error);
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 }
    );
  }
}
