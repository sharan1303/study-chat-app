import { EventData } from "@/lib/events";

// Helper function to broadcast events to specific clients or all clients
export function broadcastEvent(
  event: string,
  data: EventData,
  targetIds?: string[]
) {
  // SSE is disabled for testing - this is a no-op function
  return;

  /* Original implementation commented out
  if (!global.sseClients || global.sseClients.length === 0) {
    return;
  }

  // Check if we're targeting specific clients
  if (targetIds && targetIds.length > 0) {
    // Find the target clients
    const targetClients = global.sseClients.filter((client) =>
      targetIds.includes(client.id)
    );

    if (targetClients.length === 0) {
      console.log(
        `Warning: No matching clients found for target IDs: ${targetIds.join(
          ", "
        )}`
      );
      return;
    }

    console.log(`Found ${targetClients.length} matching clients for broadcast`);
  }

  let sentCount = 0;
  global.sseClients.forEach((client) => {
    // Send to specific clients if targetIds is provided, otherwise send to all
    if (!targetIds || targetIds.includes(client.id)) {
      try {
        client.send({
          type: event,
          data,
          timestamp: new Date().toISOString(),
        });
        sentCount++;
      } catch (error) {
        console.error(`Error sending event to client ${client.id}:`, error);
      }
    }
  });
  */
}

// Function to set up the broadcast event - to be called from the route.ts file
export function setupBroadcastEvent() {
  // SSE is disabled for testing - this is a no-op function
  return;

  /* Original implementation commented out
  // Make broadcastEvent available globally
  if (typeof global !== "undefined") {
    global.broadcastEvent = broadcastEvent;
  }
  */
}

// Add TypeScript declaration
type BroadcastEventFn = (
  event: string,
  data: EventData,
  targetIds?: string[]
) => void;

declare global {
  // eslint-disable-next-line no-var
  var broadcastEvent: BroadcastEventFn;
}
