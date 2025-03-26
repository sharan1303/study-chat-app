import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Collect information about SSE clients
    type ClientInfo = { index: number; id: string };
    let clientsInfo: ClientInfo[] = [];

    if (global.sseClients && global.sseClients.length > 0) {
      clientsInfo = global.sseClients.map((client, index) => ({
        index,
        id: client.id,
        // Add any other info you want to expose (avoid sensitive data)
      }));
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      clientsCount: global.sseClients?.length || 0,
      clients: clientsInfo,
    });
  } catch (error) {
    console.error("Error in SSE health check:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to get SSE client information",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Tell Next.js this is a dynamic API route that shouldn't be cached
export const dynamic = "force-dynamic";
