import type { Chat, Module } from "@prisma/client";

// Type for event data payloads
export interface EventData {
  id: string;
  [key: string]: string | number | boolean | null | undefined | Date | object;
}

// Type for SSE client connections
export interface SSEClient {
  id: string;
  controller: ReadableStreamDefaultController;
  connectedAt: number;
  lastActivity: number;
  ip: string;
  userAgent: string;
  send: (data: { type: string; data: EventData; timestamp: string }) => void;
}

// Event types
export const EVENT_TYPES = {
  CHAT_CREATED: "chat.created",
  CHAT_DELETED: "chat.deleted",
  MODULE_CREATED: "module.created",
  MODULE_UPDATED: "module.updated",
  MODULE_DELETED: "module.deleted",
  MESSAGE_CREATED: "message.created",
  DATA_MIGRATED: "data.migrated",
  RESOURCE_CREATED: "resource.created",
  RESOURCE_UPDATED: "resource.updated",
  RESOURCE_DELETED: "resource.deleted",
};

// Get access to the global SSE clients array
declare global {
  // eslint-disable-next-line no-var
  var sseClients: SSEClient[];
  // eslint-disable-next-line no-var
  var sseCleanupInterval: NodeJS.Timeout | null;
}

// Initialize if not already done
if (typeof global !== "undefined" && !global.sseClients) {
  global.sseClients = [];
}

// Broadcast an event to connected clients
export function broadcastEvent(
  eventType: string,
  data: EventData,
  targetIds?: string[]
): { sent: number; skipped: number } {
  // Initialize metrics
  const metrics = { sent: 0, skipped: 0 };

  if (!global.sseClients || global.sseClients.length === 0) {
    return metrics;
  }

  // Send the event to appropriate clients
  for (const client of global.sseClients) {
    // Check if this client should receive the event
    const shouldSend =
      !targetIds || targetIds.length === 0 || targetIds.includes(client.id);

    if (shouldSend) {
      try {
        client.send({
          type: eventType,
          data,
          timestamp: new Date().toISOString(),
        });
        metrics.sent++;
      } catch {
        metrics.skipped++;
      }
    } else {
      metrics.skipped++;
    }
  }

  return metrics;
}

// Specialized event broadcasters
export function broadcastChatCreated(
  chat: Omit<Chat, "messages" | "updatedAt" | "userId">,
  targetIds?: string[]
) {
  return broadcastEvent(EVENT_TYPES.CHAT_CREATED, chat, targetIds);
}

export function broadcastMessageCreated(
  messageData: {
    id: string;
    chatId: string;
    chatTitle: string;
    updatedAt: string;
  },
  targetIds?: string[]
) {
  return broadcastEvent(EVENT_TYPES.MESSAGE_CREATED, messageData, targetIds);
}

export function broadcastModuleCreated(module: Module, targetIds?: string[]) {
  return broadcastEvent(EVENT_TYPES.MODULE_CREATED, module, targetIds);
}

export function broadcastModuleUpdated(
  module: Module,
  targetIds?: string[],
  isDataMigration?: boolean
) {
  return broadcastEvent(
    EVENT_TYPES.MODULE_UPDATED,
    { ...module, isDataMigration: !!isDataMigration },
    targetIds
  );
}

export function broadcastModuleDeleted(moduleId: string, targetIds?: string[]) {
  return broadcastEvent(
    EVENT_TYPES.MODULE_DELETED,
    { id: moduleId },
    targetIds
  );
}

export function broadcastDataMigrated(
  migrationData: { userId: string; sessionId: string; id: string },
  targetIds?: string[]
) {
  return broadcastEvent(EVENT_TYPES.DATA_MIGRATED, migrationData, targetIds);
}

export function broadcastChatDeleted(
  chatData: { id: string },
  targetIds?: string[]
) {
  return broadcastEvent(EVENT_TYPES.CHAT_DELETED, chatData, targetIds);
}

export function broadcastResourceCreated(
  resourceData: { id: string; moduleId: string },
  targetIds?: string[]
) {
  // Dispatch DOM event for client-side listeners
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("resource.created", { detail: resourceData })
    );
  }
  return broadcastEvent(EVENT_TYPES.RESOURCE_CREATED, resourceData, targetIds);
}

export function broadcastResourceUpdated(
  resourceData: { id: string; moduleId: string },
  targetIds?: string[]
) {
  // Dispatch DOM event for client-side listeners
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("resource.updated", { detail: resourceData })
    );
  }
  return broadcastEvent(EVENT_TYPES.RESOURCE_UPDATED, resourceData, targetIds);
}

export function broadcastResourceDeleted(
  resourceData: { id: string; moduleId: string },
  targetIds?: string[]
) {
  // Dispatch DOM event for client-side listeners
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("resource.deleted", { detail: resourceData })
    );
  }
  return broadcastEvent(EVENT_TYPES.RESOURCE_DELETED, resourceData, targetIds);
}
