import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET /api/resources - Get all resources for the current user
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
      description: resource.content,
      type: resource.type,
      url: resource.fileUrl,
      moduleId: resource.moduleId,
      moduleName: resource.module?.name || null,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
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

// POST /api/resources - Create a new resource
export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { title, description, type, url, moduleId } = json;

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
        content: description || "",
        type,
        fileUrl: url || null,
        moduleId,
      },
    });

    return NextResponse.json({
      id: resource.id,
      title: resource.title,
      description: resource.content,
      type: resource.type,
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
