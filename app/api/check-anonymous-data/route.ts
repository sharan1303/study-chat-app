import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  // Require authentication
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the sessionId from the query
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID is required" },
      { status: 400 }
    );
  }

  try {
    // Check for any modules or resources associated with this session ID
    const moduleCount = await prisma.module.count({
      where: { sessionId },
    });

    const resourceCount = await prisma.resource.count({
      where: { sessionId },
    });

    const hasData = moduleCount > 0 || resourceCount > 0;

    return NextResponse.json({
      hasData,
      counts: {
        modules: moduleCount,
        resources: resourceCount,
      },
    });
  } catch (error) {
    console.error("Error checking anonymous data:", error);
    return NextResponse.json(
      { error: "Failed to check anonymous data" },
      { status: 500 }
    );
  }
}
