import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SESSION_ID_KEY } from "@/lib/session";
import { EventData } from "@/lib/events";

// Use ReadableStream to keep the connection open for SSE
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  const searchParams = request.nextUrl.searchParams;

  // Get sessionId from URL parameters
  const sessionIdFromParam = searchParams.get("sessionId");
  const sessionIdFromKey = searchParams.get(SESSION_ID_KEY);
  const sessionId = sessionIdFromParam || sessionIdFromKey;

  // If no userId and no sessionId was provided, return error
  if (!userId && !sessionId) {
    return new Response("Session ID or authentication required", {
      status: 401,
    });
  }

  // Set headers for SSE
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Create a readable stream for sending events
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send an initial message to establish the connection
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      // Store client info in global array for broadcasting
      if (!global.sseClients) {
        global.sseClients = [];
      }

      // Create client object with identifier and helper function to send messages
      const client = {
        id: userId || sessionId || "",
        controller,
        send: (data: { type: string; data: EventData; timestamp: string }) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        },
      };

      // Add to global clients list
      global.sseClients.push(client);

      // Define cleanup when connection is closed
      request.signal.addEventListener("abort", () => {
        // Remove client from global list when connection closes
        if (global.sseClients) {
          global.sseClients = global.sseClients.filter(
            (c) => c.id !== client.id
          );
        }
      });
    },
  });

  return new Response(stream, { headers });
}

// Helper function to broadcast events to specific clients or all clients
export function broadcastEvent(
  event: string,
  data: EventData,
  targetIds?: string[]
) {
  if (!global.sseClients || global.sseClients.length === 0) return;

  global.sseClients.forEach((client) => {
    // Send to specific clients if targetIds is provided, otherwise send to all
    if (!targetIds || targetIds.includes(client.id)) {
      client.send({
        type: event,
        data,
        timestamp: new Date().toISOString(),
      });
    }
  });
}

// Tell Next.js this is a dynamic API route that shouldn't be cached
export const dynamic = "force-dynamic";

// TypeScript declaration for global SSE clients
declare global {
  // eslint-disable-next-line no-var
  var sseClients: Array<{
    id: string;
    controller: ReadableStreamDefaultController;
    send: (data: { type: string; data: EventData; timestamp: string }) => void;
  }>;
}
