import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { broadcastResourceCreated } from "@/lib/events";
import { Prisma } from "@prisma/client";

/**
 * Validates if the specified module exists and is accessible by the given user.
 *
 * This function ensures that a valid user ID or session ID is provided and verifies that the module with the given
 * moduleId belongs to that user by querying the database. It returns an object indicating success if
 * access is confirmed, or an error object with the appropriate HTTP status code if authentication fails,
 * the module doesn't exist, or an internal error occurs.
 *
 * @param moduleId - The identifier of the module.
 * @param userId - The authenticated user's identifier. If null, authentication is considered missing.
 * @param sessionId - The anonymous session identifier. Used as fallback if userId is null.
 *
 * @returns An object with:
 * - { success: true } if the module exists and the user is authorized,
 * - or an error message with a status code:
 *   - 401 if the user is not authenticated,
 *   - 404 if the module is not found or access is denied,
 *   - 500 if a database error occurs.
 */
async function validateModuleAccess(
  moduleId: string,
  userId: string | null,
  sessionId: string | null
) {
  // Require authentication with userId or sessionId
  if (!userId && !sessionId) {
    console.error("Authentication required: No userId or sessionId provided");
    return {
      error: "Authentication required - no userId or sessionId",
      status: 401,
    };
  }

  try {
    // Build the query to find the module
    const whereCondition: Prisma.ModuleWhereInput = {
      id: moduleId,
    };

    // Add user ID or session ID to the condition
    if (userId) {
      whereCondition.userId = userId;
    } else if (sessionId) {
      whereCondition.sessionId = sessionId;
    }

    console.log("Validating module access with:", {
      moduleId,
      userId: userId ? `${userId.substring(0, 8)}...` : null,
      sessionId: sessionId ? `${sessionId.substring(0, 8)}...` : null,
      whereCondition,
    });

    // Check if the module exists and belongs to the user
    const moduleExists = await prisma.module.findFirst({
      where: whereCondition,
    });

    if (!moduleExists) {
      console.error("Module not found or access denied:", {
        moduleId,
        userId: userId ? `${userId.substring(0, 8)}...` : null,
        sessionId: sessionId ? `${sessionId.substring(0, 8)}...` : null,
      });
      return {
        error: "Module not found or access denied",
        status: 404,
      };
    }

    console.log("Module access validated successfully");
    return { success: true };
  } catch (error) {
    console.error("Error validating module access:", error);
    return {
      error: "Failed to validate module access",
      status: 500,
    };
  }
}

/**
 * Retrieves all resources associated with a specific module.
 *
 * This handler authenticates the user and validates that they have access to the requested module. If authentication fails,
 * it returns a 401 error. If the access check fails, an error response with the corresponding status code is returned.
 * When successful, it fetches the resources belonging to the authenticated user for the given module, formats the data,
 * and responds with the list of resources including details such as id, url, title, type, module information, file size,
 * and timestamps in ISO format.
 *
 * @param request - The HTTP request containing the module ID in the URL.
 * @param props - An object containing route parameters, including a promise that resolves to a module object with the id.
 *
 * @returns A JSON response containing an array of formatted resource objects or an error message with an appropriate status code.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const moduleId = id;
    const { userId: authUserId } = await auth();
    const searchParams = request.nextUrl.searchParams;
    const paramUserId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

    // Use userId from auth or query parameter
    const userId = paramUserId || authUserId;

    // Only authenticated users can access resources
    if (!userId && !sessionId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Verify that the module exists
    const moduleRecord = await prisma.module.findUnique({
      where: {
        id: moduleId,
      },
      include: {
        user: true,
      },
    });

    if (!moduleRecord) {
      return new Response("Module not found", { status: 404 });
    }

    // Build where clause for resources - only filter by moduleId
    // This ensures all resources for the module are returned
    // Security is maintained by verifying module access above
    const whereClause: Prisma.ResourceWhereInput = {
      moduleId: moduleId,
      // Don't filter by userId - get all resources for the module
    };

    // Get resources for the module
    const resources = await prisma.resource.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    return new Response(JSON.stringify({ resources }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return new Response("Internal Server Error", { status: 500 });
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
 * @param props - An object containing route parameters, including a promise that resolves to a module object with the id.
 *
 * @returns A JSON response with either the created resource data or an error message.
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { userId } = await auth();
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("sessionId");

  // Log authentication details
  console.log(`POST /api/modules/${params.id}/resources auth:`, {
    userId,
    sessionId: sessionId ? `${sessionId.substring(0, 8)}...` : null,
  });

  // Require authentication with userId or sessionId
  if (!userId && !sessionId) {
    console.error("Authentication required - no userId or sessionId");
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Extract moduleId from params
  const { id } = await params;
  const moduleId = id;
  console.log(
    `POST /api/modules/${moduleId}/resources - Creating resource for module`
  );

  // Validate module access
  const accessCheck = await validateModuleAccess(moduleId, userId, sessionId);
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

    // Broadcast the resource created event
    broadcastResourceCreated({
      id: resource.id,
      moduleId: resource.moduleId,
    });

    // Get the module name
    const moduleInfo = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { name: true },
    });

    // Map database resource to API response
    return NextResponse.json({
      id: resource.id,
      fileUrl: resource.fileUrl, // Use fileUrl consistently with DB field name
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
