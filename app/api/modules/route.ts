import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { SESSION_ID_KEY } from "@/lib/session";
import { broadcastModuleCreated } from "@/lib/events";

// Define a type for the module with count
type ModuleWithCount = {
  id: string;
  name: string;
  context: string | null;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string | null;
  sessionId: string | null;
  _count: {
    resources: number;
  };
};

// Helper function to process module requests
async function processModulesRequest(
  userId: string | null,
  sessionId: string | null,
  name?: string,
  exactMatch?: boolean
) {
  try {
    // Debug the auth state
    console.log("API processModulesRequest auth state:", {
      userId,
      sessionId,
      hasUserId: !!userId,
      hasSessionId: !!sessionId,
    });

    // Either userId or sessionId must be provided
    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Build the where clause based on either userId or sessionId
    const where = {};

    if (userId) {
      // @ts-expect-error - Dynamic property assignment
      where.userId = userId;
    } else if (sessionId) {
      // @ts-expect-error - Dynamic property assignment
      where.sessionId = sessionId;
    }

    // Add name filtering if provided
    if (name) {
      if (exactMatch) {
        // Use equals with case insensitivity for exact match
        // @ts-expect-error - Dynamic property assignment
        where.name = {
          equals: name,
          mode: "insensitive" as const,
        };
      } else {
        // Use contains with case insensitivity for fuzzy match
        // @ts-expect-error - Dynamic property assignment
        where.name = {
          contains: name,
          mode: "insensitive" as const,
        };
      }
    }

    // Fetch modules with the constructed where clause
    const modules = await prisma.module.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { resources: true },
        },
      },
    });

    // Map the modules to the expected format
    const formattedModules = modules.map((module: ModuleWithCount) => ({
      id: module.id,
      name: module.name,
      context: module.context,
      icon: module.icon,
      resourceCount: module._count.resources,
      createdAt: module.createdAt.toISOString(),
      updatedAt: module.updatedAt.toISOString(),
    }));

    return NextResponse.json({ modules: formattedModules });
  } catch (error) {
    console.error("Error processing modules request:", error);
    return NextResponse.json(
      { error: "Failed to fetch modules" },
      { status: 500 }
    );
  }
}

// GET /api/modules - Get all modules or filter by name
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name") || undefined;
  const exactMatch = searchParams.get("exactMatch") === "true";

  // Get sessionId from URL - try both parameter names for compatibility
  const sessionIdFromParam = searchParams.get("sessionId");
  const sessionIdFromKey = searchParams.get(SESSION_ID_KEY);
  const sessionId = sessionIdFromParam || sessionIdFromKey;

  // Debug the request params
  console.log("GET /api/modules params:", {
    userId,
    sessionId,
    name,
    exactMatch,
    searchParams: Object.fromEntries(searchParams.entries()),
  });

  // If no userId and no sessionId was provided in the URL, return error
  if (!userId && !sessionId) {
    console.error("Neither userId nor sessionId provided");
    return NextResponse.json(
      { error: "Session ID or authentication required" },
      { status: 401 }
    );
  }

  return processModulesRequest(
    userId || null,
    sessionId || null,
    name,
    exactMatch
  );
}

// POST /api/modules - Create a new module
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  const searchParams = request.nextUrl.searchParams;

  // Get sessionId from URL - try both parameter names for compatibility
  const sessionIdFromParam = searchParams.get("sessionId");
  const sessionIdFromKey = searchParams.get(SESSION_ID_KEY);
  const sessionId = sessionIdFromParam || sessionIdFromKey;

  // Require either userId or sessionId
  if (!userId && !sessionId) {
    return NextResponse.json(
      { error: "Session ID or authentication required" },
      { status: 401 }
    );
  }

  try {
    const { name, context, icon } = await request.json();

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Module name must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Create data object
    const data = {
      name,
      context,
      icon: icon || "📚",
    };

    // Add either userId or sessionId
    if (userId) {
      // @ts-expect-error - Known property but type system disagrees
      data.userId = userId;
      console.log(`Creating module with userId: ${userId}`);
    } else if (sessionId) {
      // @ts-expect-error - Known property but type system disagrees
      data.sessionId = sessionId;
      console.log(`Creating module with sessionId: ${sessionId}`);
    }

    console.log(
      "Module data being sent to database:",
      JSON.stringify(data, null, 2)
    );

    // Create the module with Prisma
    const moduleData = await prisma.module.create({ data });
    console.log("Created module:", JSON.stringify(moduleData, null, 2));

    // Broadcast event for real-time updates
    const targetId = userId || sessionId;
    if (targetId) {
      console.log(`Broadcasting module creation event to client ${targetId}`);
      const broadcastResult = broadcastModuleCreated(moduleData, [targetId]);
      console.log("Broadcast result:", broadcastResult);
    } else {
      console.log(
        "No target ID available for broadcasting module creation event"
      );
    }

    return NextResponse.json(moduleData);
  } catch (error) {
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

    console.error("Error creating module:", error);
    return NextResponse.json(
      { error: "Failed to create module" },
      { status: 500 }
    );
  }
}

// Add this export to tell Next.js that this route should be treated as dynamic
export const dynamic = "force-dynamic";
