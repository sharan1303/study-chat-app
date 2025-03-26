import { NextRequest, NextResponse } from "next/server";
import { SESSION_ID_KEY } from "@/lib/session";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const broadcast = searchParams.get("broadcast") === "true";
  const userId = searchParams.get("userId");

  // Get sessionId from URL parameters
  const sessionIdFromParam = searchParams.get("sessionId");
  const sessionIdFromKey = searchParams.get(SESSION_ID_KEY);
  const sessionId = sessionIdFromParam || sessionIdFromKey;

  // Use either userId or sessionId
  const clientId = userId || sessionId;

  try {
    // Broadcast a test event if requested
    if (broadcast) {
      const testData = {
        id: "test-" + Date.now(),
        title: "Test Chat",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        moduleId: null,
      };

      if (clientId) {
        console.log(`Broadcasting test event to client: ${clientId}`);
        global.broadcastEvent("chat.created", testData, [clientId as string]);
      } else {
        console.log("Broadcasting test event to all clients");
        global.broadcastEvent("chat.created", testData);
      }

      return NextResponse.json({
        status: "ok",
        broadcast: true,
        timestamp: new Date().toISOString(),
        testData,
      });
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in ping handler:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to process ping request",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Tell Next.js this is a dynamic API route that shouldn't be cached
export const dynamic = "force-dynamic";
