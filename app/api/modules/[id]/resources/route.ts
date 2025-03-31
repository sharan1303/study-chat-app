import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

/**
 * Validates if the specified module exists and is accessible by the given user.
 *
 * This function ensures that a valid user ID is provided and verifies that the module with the given
 * moduleId belongs to that user by querying the database. It returns an object indicating success if
 * access is confirmed, or an error object with the appropriate HTTP status code if authentication fails,
 * the module doesn't exist, or an internal error occurs.
 *
 * @param moduleId - The identifier of the module.
 * @param userId - The authenticated user's identifier. If null, authentication is considered missing.
 *
 * @returns An object with:
 * - { success: true } if the module exists and the user is authorized,
 * - or an error message with a status code:
 *   - 401 if the user is not authenticated,
 *   - 404 if the module is not found or access is denied,
 *   - 500 if a database error occurs.
 */
async function validateModuleAccess(moduleId: string, userId: string | null) {
  // Require authentication with userId
  if (!userId) {
    return {
      error: "Authentication required",
      status: 401,
    };
  }

  try {
    // Build the query to find the module
    const whereCondition = {
      id: moduleId,
      userId,
    };

    // Check if the module exists and belongs to the user
    const moduleExists = await prisma.module.findFirst({
      where: whereCondition,
    });

    if (!moduleExists) {
      return {
        error: "Module not found or access denied",
        status: 404,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error validating module access:", error);
    return {
      error: "Failed to validate module access",
      status: 500,
    };
  }
}

// Define a Resource type to match Prisma schema
type ResourceType = {
  id: string;
  fileUrl: string | null; // Changed to match Prisma type
  title: string;
  type: string;
  moduleId: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  fileSize: number | null;
  module?: {
    name: string;
  };
};

/**
 * Retrieves all resources associated with a specific module.
 *
 * This handler authenticates the user and validates that they have access to the requested module. If authentication fails,
 * it returns a 401 error. If the access check fails, an error response with the corresponding status code is returned.
 * When successful, it fetches the resources belonging to the authenticated user for the given module, formats the data,
 * and responds with the list of resources including details such as id, url, title, type, module information, file size,
 * and timestamps in ISO format.
 *
 * @param props - An object whose `params` promise resolves to an object containing:
 *   - moduleId: The identifier for the module whose resources are being retrieved.
 *
 * @returns A JSON response containing an array of formatted resource objects or an error message with an appropriate status code.
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ moduleId: string }> }
) {
  const params = await props.params;
  const { userId } = await auth();

  // Require authentication with userId
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const { moduleId } = params;

  // Validate module access
  const accessCheck = await validateModuleAccess(moduleId, userId);
  if (!accessCheck.success) {
    return NextResponse.json(
      { error: accessCheck.error },
      { status: accessCheck.status }
    );
  }

  try {
    // Fetch resources for the module
    const resources = await prisma.resource.findMany({
      where: {
        moduleId,
        userId, // Only fetch resources created by this user
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

    // Format the response
    const formattedResources = resources.map((resource: ResourceType) => ({
      id: resource.id,
      url: resource.fileUrl, // Map fileUrl from DB to url in API response
      title: resource.title,
      type: resource.type,
      moduleId: resource.moduleId,
      moduleName: resource.module?.name || null,
      fileSize: resource.fileSize || null,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
    }));

    return NextResponse.json({ resources: formattedResources });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

/**
 * Creates a new resource for a specified module.
 *
 * This endpoint authenticates the user and verifies that they have access to the module before creating a resource. It parses the request body for resource details—requiring either a URL or content and ensuring a title of at least 2 characters—and then stores the resource in the database. On success, it returns a JSON payload with the resource details, including the mapped URL, file size, and module name.
 *
 * The response may include:
 * - A 401 status if the user is not authenticated.
 * - A 400 status if validation fails (missing URL/content or an invalid title).
 * - A 500 status if an error occurs during resource creation.
 *
 * @param request - The HTTP request containing the resource data in its JSON body.
 * @param props - An object containing route parameters, including a promise that resolves to an object with the moduleId.
 *
 * @returns A JSON response with either the created resource data or an error message.
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ moduleId: string }> }
) {
  const params = await props.params;
  const { userId } = await auth();

  // Require authentication with userId
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const { moduleId } = params;

  // Validate module access
  const accessCheck = await validateModuleAccess(moduleId, userId);
  if (!accessCheck.success) {
    return NextResponse.json(
      { error: accessCheck.error },
      { status: accessCheck.status }
    );
  }

  try {
    // Destructure the request body for resource creation
    const { url, title, content, type } = await request.json();

    // Validate required fields
    if (!url && !content) {
      return NextResponse.json(
        { error: "Either URL or content is required" },
        { status: 400 }
      );
    }

    if (!title || title.trim().length < 2) {
      return NextResponse.json(
        { error: "Title must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Create the resource - map url from request to fileUrl in database
    const resource = await prisma.resource.create({
      data: {
        fileUrl: url || null, // Map 'url' from API to 'fileUrl' in DB
        title,
        type: type || "note",
        moduleId,
        userId, // Always set userId, never use sessionId
      },
    });

    // Get the module name
    const moduleInfo = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { name: true },
    });

    // Map database resource to API response (add url field for backwards compatibility)
    return NextResponse.json({
      id: resource.id,
      url: resource.fileUrl, // Map 'fileUrl' from DB to 'url' in API
      title: resource.title,
      type: resource.type,
      fileSize: resource.fileSize || null,
      moduleId: resource.moduleId,
      moduleName: moduleInfo?.name || null,
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
