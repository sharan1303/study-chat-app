import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

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
        lastStudied: new Date(),
      } as Prisma.ModuleUncheckedUpdateInput,
    });

    return NextResponse.json(updatedModule);
  } catch (error) {
    console.error("Error updating module last studied time:", error);
    return NextResponse.json(
      { error: "Failed to update module last studied time" },
      { status: 500 }
    );
  }
}
