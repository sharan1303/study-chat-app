import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET /api/resources - Get all resources for the current user
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch resources from the database
    const resources = await prisma.resource.findMany({
      where: {
        module: {
          userId,
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
