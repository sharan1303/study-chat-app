import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// Helper function to validate module access
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

// GET /api/modules/[moduleId]/resources - Get all resources for a module
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

// POST /api/modules/[moduleId]/resources - Create a new resource
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
