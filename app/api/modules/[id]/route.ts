import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const moduleId = params.id;
    const modules = await prisma.module.findUnique({
      where: {
        id: moduleId,
        userId: userId,
      },
      include: {
        resources: true,
      },
    });

    if (!modules) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    return NextResponse.json(modules);
  } catch (error) {
    console.error("Error fetching module:", error);
    return NextResponse.json(
      { error: "Failed to fetch module" },
      { status: 500 }
    );
  }
}

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
    const { name, description, icon, progress } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if module exists and belongs to user
    const existingModule = await prisma.module.findFirst({
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
        name,
        description,
        icon,
        progress: progress !== undefined ? progress : undefined,
      } as Prisma.ModuleUncheckedUpdateInput,
    });

    return NextResponse.json(updatedModule);
  } catch (error) {
    console.error("Error updating module:", error);
    return NextResponse.json(
      { error: "Failed to update module" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const existingModule = await prisma.module.findFirst({
      where: {
        id: moduleId,
        userId: userId,
      },
    });

    if (!existingModule) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Delete the module
    await prisma.module.delete({
      where: {
        id: moduleId,
      },
    });

    return NextResponse.json({ message: "Module deleted successfully" });
  } catch (error) {
    console.error("Error deleting module:", error);
    return NextResponse.json(
      { error: "Failed to delete module" },
      { status: 500 }
    );
  }
}
