import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { deleteFile } from "@/lib/supabase";

// Add this export to tell Next.js that this route should be treated as dynamic
export const dynamic = "force-dynamic";

// GET /api/resources/[id] - Get resource details
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { userId } = await auth();
  const resourceId = params.id;

  // Require authentication with userId
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Fetch the resource with ownership check
    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        module: {
          userId,
        },
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
      type: resource.type,
      url: resource.fileUrl,
      moduleId: resource.moduleId,
      moduleName: resource.module?.name || null,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
      fileSize: resource.fileSize || null,
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
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { userId } = await auth();
  const resourceId = params.id;

  // Require authentication with userId
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Check if the resource exists and belongs to the user
    const existingResource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        module: {
          userId,
        },
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

    // If moduleId is changing, verify user has access to the target module
    if (moduleId && moduleId !== existingResource.moduleId) {
      const targetModule = await prisma.module.findFirst({
        where: {
          id: moduleId,
          userId,
        },
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
      type: updatedResource.type,
      url: updatedResource.fileUrl,
      moduleId: updatedResource.moduleId,
      moduleName: updatedResource.module?.name || null,
      createdAt: updatedResource.createdAt.toISOString(),
      updatedAt: updatedResource.updatedAt.toISOString(),
      fileSize: updatedResource.fileSize || null,
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
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { userId } = await auth();
  const resourceId = params.id;

  // Require authentication with userId
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Check if the resource exists and belongs to the user
    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        module: {
          userId,
        },
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 }
      );
    }

    // If the resource has a file URL in Supabase storage, delete it
    if (resource.fileUrl) {
      try {
        // Extract the path from the fileUrl
        const fileUrl = new URL(resource.fileUrl);
        const pathname = fileUrl.pathname;

        // Extract the path from the URL that matches Supabase storage pattern
        // /storage/v1/object/sign/resources/{userId}/{moduleId}/filename.ext
        const pathMatch = pathname.match(
          /\/storage\/v1\/object\/sign\/resources\/(.*)/
        );

        if (pathMatch && pathMatch[1]) {
          const storagePath = pathMatch[1];
          await deleteFile("resources", storagePath);
          console.log(`Deleted file from storage: ${storagePath}`);
        }
      } catch (storageError) {
        // Log the error but continue with resource deletion from database
        console.error("Error deleting file from storage:", storageError);
      }
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
