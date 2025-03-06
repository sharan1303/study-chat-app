import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get moduleId from query parameter
    const url = new URL(req.url);
    const moduleId = url.searchParams.get("moduleId");

    if (!moduleId) {
      return NextResponse.json(
        { error: "Module ID is required" },
        { status: 400 }
      );
    }

    // Find the module with resources
    const moduleData = await prisma.module.findUnique({
      where: {
        id: moduleId,
        userId: userId,
      },
      include: {
        resources: true,
      },
    });

    if (!moduleData) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Update the lastStudied timestamp
    await prisma.module.update({
      where: {
        id: moduleId,
      },
      data: {
        lastStudied: new Date(),
      },
    });

    // Convert Date objects to ISO strings for client components
    const serializedModule = {
      ...moduleData,
      createdAt: moduleData.createdAt.toISOString(),
      updatedAt: moduleData.updatedAt.toISOString(),
      lastStudied: moduleData.lastStudied
        ? moduleData.lastStudied.toISOString()
        : null,
      resources: moduleData.resources.map((resource) => ({
        ...resource,
        createdAt: resource.createdAt.toISOString(),
        updatedAt: resource.updatedAt.toISOString(),
      })),
    };

    return NextResponse.json(serializedModule);
  } catch (error) {
    console.error("Error fetching active module details:", error);
    return NextResponse.json(
      { error: "Failed to fetch module details" },
      { status: 500 }
    );
  }
}
