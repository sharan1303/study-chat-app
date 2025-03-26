import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { SESSION_ID_KEY } from "@/lib/session";

// Helper function to validate module access
async function validateModuleAccess(
  moduleId: string,
  userId: string | null,
  sessionId: string | null
) {
  // Require authentication via userId or sessionId
  if (!userId && !sessionId) {
    return {
      error: "Authentication required",
      status: 401,
    };
  }

  try {
    // Build the query to find the module
    const whereCondition = {
      id: moduleId,
      ...(userId ? { userId } : {}),
      ...(sessionId ? { sessionId } : {}),
    };

    // Check if the module exists and belongs to the user/session
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
  content: string | null;
  type: string;
  moduleId: string;
  userId: string | null;
  sessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// GET /api/modules/[moduleId]/resources - Get all resources for a module
export async function GET(request: NextRequest, props: { params: Promise<{ moduleId: string }> }) {
  const params = await props.params;
  const { userId } = await auth();
  const searchParams = request.nextUrl.searchParams;

  // Get sessionId from URL - try both parameter names for compatibility
  const sessionIdFromParam = searchParams.get("sessionId");
  const sessionIdFromKey = searchParams.get(SESSION_ID_KEY);
  const sessionId = sessionIdFromParam || sessionIdFromKey;

  // For anonymous users, require a session ID
  if (!userId && !sessionId) {
    return NextResponse.json(
      { error: "Session ID or authentication required" },
      { status: 401 }
    );
  }

  const { moduleId } = params;

  // Validate module access
  const accessCheck = await validateModuleAccess(
    moduleId,
    userId || null,
    sessionId
  );
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format the response
    const formattedResources = resources.map((resource: ResourceType) => ({
      id: resource.id,
      url: resource.fileUrl, // Map fileUrl from DB to url in API response
      title: resource.title,
      content: resource.content,
      type: resource.type,
      moduleId: resource.moduleId,
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

// POST /api/modules/[moduleId]/resources - Create a new resource
export async function POST(request: NextRequest, props: { params: Promise<{ moduleId: string }> }) {
  const params = await props.params;
  const { userId } = await auth();
  const searchParams = request.nextUrl.searchParams;

  // Get sessionId from URL - try both parameter names for compatibility
  const sessionIdFromParam = searchParams.get("sessionId");
  const sessionIdFromKey = searchParams.get(SESSION_ID_KEY);
  const sessionId = sessionIdFromParam || sessionIdFromKey;

  // For anonymous users, require a session ID
  if (!userId && !sessionId) {
    return NextResponse.json(
      { error: "Session ID or authentication required" },
      { status: 401 }
    );
  }

  const { moduleId } = params;

  // Validate module access
  const accessCheck = await validateModuleAccess(
    moduleId,
    userId || null,
    sessionId
  );
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
        content: content || null,
        type: type || "note",
        moduleId,
        userId: userId || null,
        sessionId: userId ? null : sessionId,
      },
    });

    // Map database resource to API response (add url field for backwards compatibility)
    return NextResponse.json({
      id: resource.id,
      url: resource.fileUrl, // Map 'fileUrl' from DB to 'url' in API
      title: resource.title,
      content: resource.content,
      type: resource.type,
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
