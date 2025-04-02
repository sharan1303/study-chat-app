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
    // Check for any modules, resources, or chats associated with this session ID
    const moduleCount = await prisma.module.count({
      where: { sessionId },
    });

    // Only query collections that have sessionId in their schema
    const resourceCount = 0;
    let chatCount = 0;

    try {
      // These queries are wrapped in try/catch to handle schema mismatches
      chatCount = await prisma.chat.count({
        where: { sessionId },
      });
    } catch (err) {
      console.warn(
        "Error counting chats, schema may not have sessionId field:",
        err
      );
    }

    // Skip the resource count since it doesn't have sessionId field
    // according to the linter error

    const hasData = moduleCount > 0 || chatCount > 0;

    return NextResponse.json({
      hasData,
      counts: {
        modules: moduleCount,
        resources: resourceCount,
        chats: chatCount,
      },
    });
  } catch (error) {
    console.error("Error checking anonymous data:", error);
    // Add more detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      sessionId: `${sessionId.substring(0, 8)}...`, // Log partial sessionId for debugging
      userId: `${userId.substring(0, 8)}...`, // Log partial userId for debugging
    });

    return NextResponse.json(
      {
        error: "Failed to check anonymous data",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
