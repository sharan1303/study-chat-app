import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  const moduleId = params.id;

  if (!userId) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    // Verify user owns this module
    const moduleData = await prisma.module.findUnique({
      where: {
        id: moduleId,
        userId,
      },
    });

    if (!moduleData) {
      return new NextResponse(JSON.stringify({ error: "Module not found" }), {
        status: 404,
      });
    }

    // Update the lastStudied timestamp
    const updatedModule = await prisma.module.update({
      where: {
        id: moduleId,
      },
      data: {
        lastStudied: new Date(),
      },
      select: {
        id: true,
        name: true,
        icon: true,
        lastStudied: true,
      },
    });

    return NextResponse.json({
      module: {
        ...updatedModule,
        lastStudied: updatedModule.lastStudied?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("Error updating module lastStudied:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
      }
    );
  }
}
