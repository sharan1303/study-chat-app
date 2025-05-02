import type { Chat, Module } from "@prisma/client";

// Type for event data payloads
export interface EventData {
  id: string;
  [key: string]: string | number | boolean | null | undefined | Date | object;
}

// Type definition for SSE clients
interface SSEClient {
  res: {
    write: (data: string) => void;
  };
  userId?: string;
  sessionId?: string;
}

// Event types
export const EVENT_TYPES = {
  CHAT_CREATED: "chat.created",
  CHAT_DELETED: "chat.deleted",
  MODULE_CREATED: "module.created",
  MODULE_UPDATED: "module.updated",
  MODULE_DELETED: "module.deleted",
  MESSAGE_CREATED: "message.created",
  USER_MESSAGE_SENT: "user.message.sent",
  DATA_MIGRATED: "data.migrated",
  RESOURCE_CREATED: "resource.created",
  RESOURCE_UPDATED: "resource.updated",
  RESOURCE_DELETED: "resource.deleted",
};

// Add global type declaration
declare global {
  var clients: Record<string, SSEClient> | undefined;
  // eslint-disable-next-line no-var
  var sseClients: SSEClient[];
  // eslint-disable-next-line no-var
  var sseCleanupInterval: NodeJS.Timeout | null;
}

// Initialize if not already done
if (typeof global !== "undefined" && !global.sseClients) {
  global.sseClients = [];
}

// Broadcast an event to registered clients
export function broadcastEvent(
  eventType: string,
  data: any,
  targetIds?: string[]
) {
  if (!global.clients || Object.keys(global.clients).length === 0) {
    console.warn(`No SSE clients connected for event: ${eventType}`);
    return;
  }

  const event = {
    type: eventType,
    data,
    timestamp: new Date().toISOString(),
  };

  console.log(`Broadcasting event: ${eventType}`, {
    targetIds: targetIds || "all",
    numClients: Object.keys(global.clients).length,
    dataKeys: Object.keys(data),
  });

  // Check if data contains expected properties for specific event types
  if (eventType === EVENT_TYPES.CHAT_CREATED && (!data.id || !data.title)) {
    console.warn(
      `CHAT_CREATED event missing critical data - id: ${data.id}, title: ${data.title}`
    );
  }

  let clientCount = 0;
  let targetedClientCount = 0;

  for (const clientId in global.clients) {
    // If targetIds is specified, only send to those clients
    if (targetIds && targetIds.length > 0) {
      // Check if this client ID is in the target list
      if (
        targetIds.includes(global.clients[clientId]?.userId || "") ||
        targetIds.includes(global.clients[clientId]?.sessionId || "")
      ) {
        global.clients[clientId]?.res.write(
          `data: ${JSON.stringify(event)}\n\n`
        );
        targetedClientCount++;
      }
    } else {
      // Broadcast to all clients
      global.clients[clientId]?.res.write(`data: ${JSON.stringify(event)}\n\n`);
      clientCount++;
    }
  }

  console.log(
    `Event ${eventType} sent to ${
      targetIds ? targetedClientCount : clientCount
    } clients ${targetIds ? `(out of ${targetIds.length} targets)` : ""}`
  );

  return event;
}

// Specialized event broadcasters
export function broadcastChatCreated(
  chat: Omit<Chat, "messages" | "updatedAt" | "userId"> & {
    optimisticChatId?: string;
  },
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
    moduleId: string | null;
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

// New function to broadcast when a user sends a message
export function broadcastUserMessageSent(
  messageData: {
    id: string;
    chatId: string;
    chatTitle: string;
    updatedAt: string;
    moduleId: string | null;
    module?: {
      id: string;
      name: string;
      icon: string;
    } | null;
    optimisticChatId?: string;
  },
  targetIds?: string[]
) {
  return broadcastEvent(EVENT_TYPES.USER_MESSAGE_SENT, messageData, targetIds);
}
