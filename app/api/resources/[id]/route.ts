import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// PUT /api/resources/[id] - Update a resource
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { title, description, moduleId } = json;

    // Validate the request
    if (title !== undefined && title.length < 2) {
      return NextResponse.json(
        { error: "Title must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Check if the resource exists and belongs to the user
    const existingResource = await prisma.resource.findFirst({
      where: {
        id: params.id,
        module: {
          userId,
        },
      },
    });

    if (!existingResource) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 }
      );
    }

    // If moduleId is provided, check if the module exists and belongs to the user
    if (moduleId) {
      const moduleExists = await prisma.module.findUnique({
        where: {
          id: moduleId,
          userId,
        },
      });

      if (!moduleExists) {
        return NextResponse.json(
          { error: "Module not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Update the resource
    const updatedResource = await prisma.resource.update({
      where: {
        id: params.id,
      },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { content: description }),
        ...(moduleId !== undefined && { moduleId }),
      },
      include: {
        module: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedResource.id,
      title: updatedResource.title,
      description: updatedResource.content,
      type: updatedResource.type,
      url: updatedResource.fileUrl,
      moduleId: updatedResource.moduleId,
      moduleName: updatedResource.module?.name || null,
      createdAt: updatedResource.createdAt.toISOString(),
      updatedAt: updatedResource.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error updating resource:", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    );
  }
}

// DELETE /api/resources/[id] - Delete a resource
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if the resource exists and belongs to the user
    const existingResource = await prisma.resource.findFirst({
      where: {
        id: params.id,
        module: {
          userId,
        },
      },
    });

    if (!existingResource) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the resource
    await prisma.resource.delete({
      where: {
        id: params.id,
      },
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
