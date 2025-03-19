import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get the sessionId from the URL params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Count modules and resources for this session
    const moduleCount = await prisma.module.count({
      where: {
        sessionId: sessionId,
      },
    });

    const resourceCount = await prisma.resource.count({
      where: {
        module: {
          sessionId: sessionId,
        },
      },
    });

    return NextResponse.json({
      hasData: moduleCount > 0 || resourceCount > 0,
      moduleCount,
      resourceCount,
    });
  } catch (error) {
    console.error("Error checking anonymous data:", error);
    return NextResponse.json(
      { error: "Failed to check for anonymous data" },
      { status: 500 }
    );
  }
}
