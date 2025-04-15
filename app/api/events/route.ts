import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SESSION_ID_KEY } from "@/lib/session";
import { EventData } from "@/lib/events";
import { setupBroadcastEvent } from "@/lib/events/broadcast";

// Track connection attempts for debugging
const connectionAttempts = new Map();

// Use ReadableStream to keep the connection open for SSE
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  const searchParams = request.nextUrl.searchParams;

  // Get sessionId from URL parameters
  const sessionIdFromParam = searchParams.get("sessionId");
  const sessionIdFromKey = searchParams.get(SESSION_ID_KEY);
  const sessionId = sessionIdFromParam || sessionIdFromKey;

  // Track client IP and user agent for debugging
  const clientIP = request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // If no userId and no sessionId was provided, return error
  if (!userId && !sessionId) {
    console.log(
      `SSE connection rejected: No user ID or session ID provided (${clientIP})`
    );
    return new Response("Session ID or authentication required", {
      status: 401,
    });
  }

  const clientId = userId || sessionId || "";

  // Track connection attempts for debugging
  if (!connectionAttempts.has(clientId)) {
    connectionAttempts.set(clientId, { count: 0, lastAttempt: Date.now() });
  }

  const clientAttempts = connectionAttempts.get(clientId);
  clientAttempts.count++;
  clientAttempts.lastAttempt = Date.now();


  // Check if this client already has an active connection
  const hasExistingConnection = global.sseClients?.some(
    (c) => c.id === clientId
  );
  if (hasExistingConnection) {
    console.log(
      `Client ${clientId} already has an active connection. Cleaning up old connection.`
    );
    // We'll establish a new connection and the old one will be removed when it's aborted
  }

  // Set headers for SSE
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // Disable buffering in Nginx
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
        id: clientId,
        controller,
        connectedAt: Date.now(),
        ip: clientIP,
        userAgent: userAgent.substring(0, 100), // Trim long user agents
        lastActivity: Date.now(),
        send: (data: { type: string; data: EventData; timestamp: string }) => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
            client.lastActivity = Date.now();
          } catch (error) {
            console.error(`Error sending event to client ${client.id}:`, error);
          }
        },
      };

      // Add to global clients list
      // Check if there's an existing client with same ID - remove it first
      if (global.sseClients) {
        const existingClientIndex = global.sseClients.findIndex(
          (c) => c.id === clientId
        );
        if (existingClientIndex !== -1) {
          global.sseClients.splice(existingClientIndex, 1);
        }
      }

      global.sseClients.push(client);

      // Send an acknowledgment to confirm the connection is established
      setTimeout(() => {
        try {
          client.send({
            type: "CONNECTION_ACK",
            data: { id: client.id, connectedAt: client.connectedAt },
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error(
            `[SSE DEBUG] Error sending acknowledgment to client ${client.id}:`,
            error
          );
        }
      }, 500);

      // Define cleanup when connection is closed
      request.signal.addEventListener("abort", () => {
        // Remove client from global list when connection closes
        if (global.sseClients) {
          const beforeCount = global.sseClients.length;
          global.sseClients = global.sseClients.filter(
            (c) => c.id !== client.id || c.connectedAt > client.connectedAt
          );
          // Only log if we actually removed something
          if (beforeCount !== global.sseClients.length) {
            console.log(
              `SSE client ${client.id} removed. Remaining clients: ${global.sseClients.length}`
            );
          }
        }
      });

      // Set up a heartbeat to keep the connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "heartbeat",
                timestamp: new Date().toISOString(),
              })}\n\n`
            )
          );
          client.lastActivity = Date.now();
        } catch (error) {
          console.error(`Heartbeat error for client ${client.id}:`, error);
          clearInterval(heartbeatInterval);
        }
      }, 30000); // Send heartbeat every 30 seconds

      // Clean up interval on abort
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
      });
    },
  });

  return new Response(stream, { headers });
}

// Clean up dead connections periodically
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const CONNECTION_TIMEOUT = 10 * 60 * 1000; // 10 minutes

if (typeof global !== "undefined") {
  // Only set up in a server environment
  if (!global.sseCleanupInterval) {
    global.sseCleanupInterval = setInterval(() => {
      if (!global.sseClients || global.sseClients.length === 0) return;

      const now = Date.now();
      const beforeCount = global.sseClients.length;

      // Remove clients that haven't had activity in the timeout period
      global.sseClients = global.sseClients.filter((client) => {
        const isActive = now - client.lastActivity < CONNECTION_TIMEOUT;
        if (!isActive) {
          console.log(
            `Removing inactive SSE client ${
              client.id
            } (inactive for ${Math.round(
              (now - client.lastActivity) / 1000
            )} seconds)`
          );
        }
        return isActive;
      });

      if (beforeCount !== global.sseClients.length) {
        console.log(
          `SSE cleanup removed ${
            beforeCount - global.sseClients.length
          } inactive clients. Remaining: ${global.sseClients.length}`
        );
      }
    }, CLEANUP_INTERVAL);

    console.log("SSE connection cleanup interval initialized");
  }
}

// Setup the broadcast event function
setupBroadcastEvent();

// Tell Next.js this is a dynamic API route that shouldn't be cached
export const dynamic = "force-dynamic";
