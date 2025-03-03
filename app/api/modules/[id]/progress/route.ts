import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const moduleId = params.id;
    const body = await req.json();
    const { progress } = body;

    if (
      progress === undefined ||
      typeof progress !== "number" ||
      progress < 0 ||
      progress > 100
    ) {
      return NextResponse.json(
        { error: "Valid progress value (0-100) is required" },
        { status: 400 }
      );
    }

    // Check if module exists and belongs to user
    const existingModule = await prisma.module.findUnique({
      where: {
        id: moduleId,
        userId: userId,
      },
    });

    if (!existingModule) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const updatedModule = await prisma.module.update({
      where: {
        id: moduleId,
      },
      data: {
        progress,
        lastStudied: new Date(),
      } as Prisma.ModuleUncheckedUpdateInput,
    });

    return NextResponse.json(updatedModule);
  } catch (error) {
    console.error("Error updating module progress:", error);
    return NextResponse.json(
      { error: "Failed to update module progress" },
      { status: 500 }
    );
  }
}
