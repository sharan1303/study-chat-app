import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// Helper function to process module requests
async function processModulesRequest(
  userId: string | null,
  sessionId: string | null,
  name?: string
) {
  try {
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
      // @ts-expect-error - Dynamic property assignment
      where.name = {
        contains: name,
        mode: "insensitive" as const,
      };
    }

    // Fetch modules with the constructed where clause
    const modules = await prisma.module.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { resources: true },
        },
      },
    });

    // Map the modules to the expected format
    const formattedModules = modules.map((module) => ({
      id: module.id,
      name: module.name,
      description: module.description,
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
  const sessionId = searchParams.get("sessionId") || null;

  return processModulesRequest(userId || null, sessionId, name);
}

// POST /api/modules - Create a new module
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("sessionId") || null;

  // Require either userId or sessionId
  if (!userId && !sessionId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { name, description, icon } = await request.json();

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Module name must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Create data object
    const data = {
      name,
      description,
      icon: icon || "📚",
    };

    // Add either userId or sessionId
    if (userId) {
      // @ts-expect-error - Known property but type system disagrees
      data.userId = userId;
    } else if (sessionId) {
      // @ts-expect-error - Known property but type system disagrees
      data.sessionId = sessionId;
    }

    // Create the module with Prisma
    const moduleData = await prisma.module.create({ data });

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
