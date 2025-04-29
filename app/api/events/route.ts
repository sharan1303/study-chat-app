import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SESSION_ID_KEY } from "@/lib/session";
import { EventData } from "@/lib/events";
import { setupBroadcastEvent } from "@/lib/events/broadcast";

// Max connection duration for Vercel serverless (slightly less than 90s limit)
const MAX_CONNECTION_DURATION = 85 * 1000; // 85 seconds

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

  // Set headers for SSE
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // Disable buffering in Nginx
    // Add CORS headers to allow EventSource connections
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  // Create a readable stream for sending events with timeout for Vercel
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const startTime = Date.now();

      // Send an initial message to establish the connection
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      // Add an initial comment to help keep the connection alive with some proxies
      controller.enqueue(encoder.encode(": keep-alive comment\n\n"));

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
            // If controller is already closed, skip logging
            if (
              !(
                error instanceof TypeError &&
                error.message.includes("Controller is already closed")
              )
            ) {
              console.error(
                `Error sending event to client ${client.id}:`,
                error
              );
            }
            // Remove client from global array
            removeClient(client.id);
            clearInterval(heartbeatInterval);
            clearTimeout(connectionTimeout);
          }
        },
      };

      // Function to remove client from global array
      const removeClient = (id: string) => {
        if (global.sseClients) {
          const beforeCount = global.sseClients.length;
          global.sseClients = global.sseClients.filter(
            (c) => c.id !== id || c.connectedAt > client.connectedAt
          );
          // Log only if we actually removed something
          if (beforeCount !== global.sseClients.length) {
            console.log(
              `SSE client ${id} removed. Remaining clients: ${global.sseClients.length}`
            );
          }
        }
      };

      // Check for existing client with same ID - remove it first
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
        removeClient(client.id);
        clearInterval(heartbeatInterval);
        clearTimeout(connectionTimeout);
      });

      // Set up a heartbeat to keep the connection alive (every 15 seconds)
      const heartbeatInterval = setInterval(() => {
        try {
          // Check if we're close to the timeout limit
          if (Date.now() - startTime > MAX_CONNECTION_DURATION - 5000) {
            // Send a special reconnect message and close this connection
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "RECONNECT",
                  timestamp: new Date().toISOString(),
                  message: "Connection timeout - please reconnect",
                })}\n\n`
              )
            );

            // Close this connection
            controller.close();
            removeClient(client.id);
            clearInterval(heartbeatInterval);
            clearTimeout(connectionTimeout);
            return;
          }

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
          removeClient(client.id);
          clearInterval(heartbeatInterval);
          clearTimeout(connectionTimeout);
        }
      }, 15000); // Send heartbeat every 15 seconds

      // Set a forced timeout for Vercel serverless functions
      const connectionTimeout = setTimeout(() => {
        try {
          // Send reconnect instruction before closing
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "RECONNECT",
                timestamp: new Date().toISOString(),
                message: "Connection timeout - please reconnect",
              })}\n\n`
            )
          );

          // Close controller
          controller.close();
          removeClient(client.id);
          clearInterval(heartbeatInterval);
        } catch (error) {
          console.error(
            `Error closing connection for client ${client.id}:`,
            error
          );
        }
      }, MAX_CONNECTION_DURATION);
    },
  });

  return new Response(stream, { headers });
}

// Clean up dead connections periodically (shorter interval for Vercel)
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
const CONNECTION_TIMEOUT = 2 * 60 * 1000; // 2 minutes

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
