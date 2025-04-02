import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { broadcastResourceCreated } from "@/lib/events";

/**
 * Retrieves all resources for the authenticated user.
 *
 * This function handles GET requests by first verifying user authentication. It extracts an
 * optional module ID from the query parameters and queries the database for resources linked to
 * the user's modules. The returned resources are formatted to include key details such as the module
 * name, creation and update timestamps, and file size. If the user is not authenticated, a 401 error
 * is returned; if an error occurs during data retrieval, a 500 error is returned.
 *
 * @param request - The incoming HTTP request.
 * @returns A JSON response containing an array of formatted resource objects or an error message.
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  const searchParams = request.nextUrl.searchParams;
  const moduleId = searchParams.get("moduleId");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch resources from the database
    const resources = await prisma.resource.findMany({
      where: {
        module: {
          userId,
          ...(moduleId ? { id: moduleId } : {}),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        module: {
          select: {
            name: true,
          },
        },
      },
    });

    // Format the resources to include the module name
    const formattedResources = resources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      type: resource.type,
      url: resource.fileUrl,
      moduleId: resource.moduleId,
      moduleName: resource.module?.name || null,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
      fileSize: resource.fileSize || null,
    }));

    return NextResponse.json(formattedResources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

/**
 * Creates a new resource for the authenticated user.
 *
 * Expects a JSON body with the resource properties:
 * - title: The resource title (required).
 * - type: The resource type (required).
 * - url: The URL for the resource file (optional).
 * - moduleId: The identifier of the module the resource belongs to (required).
 *
 * Returns a JSON response with the newly created resource's details if successful.
 * If the request is missing required fields, the module is not found or not accessible by the user, or an error occurs during creation,
 * an appropriate JSON error response with a corresponding HTTP status is returned.
 *
 * @param request - The HTTP request containing the JSON body with resource details.
 *
 * @returns A JSON response with the new resource details on success, or an error message on failure.
 */
export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { title, type, url, moduleId } = json;

    // Validate the request
    if (!title || !type || !moduleId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if the module exists and belongs to the user
    const moduleRecord = await prisma.module.findUnique({
      where: {
        id: moduleId,
        userId,
      },
    });

    if (!moduleRecord) {
      return NextResponse.json(
        { error: "Module not found or access denied" },
        { status: 404 }
      );
    }

    // Create the resource
    const resource = await prisma.resource.create({
      data: {
        title,
        type,
        fileUrl: url || null,
        moduleId,
      },
    });

    // Broadcast the resource created event
    broadcastResourceCreated({
      id: resource.id,
      moduleId: resource.moduleId,
    });

    return NextResponse.json({
      id: resource.id,
      title: resource.title,
      type: resource.type,
      fileSize: resource.fileSize || null,
      url: resource.fileUrl,
      moduleId: resource.moduleId,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error creating resource:", error);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}

// Add this export to tell Next.js that this route should be treated as dynamic
export const dynamic = "force-dynamic";
