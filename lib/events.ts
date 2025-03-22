import { ReadableStreamDefaultController } from "stream/web";

// Define event types for type safety
export enum EventType {
  MODULE_CREATED = "module-created",
  MODULE_UPDATED = "module-updated",
  MODULE_DELETED = "module-deleted",
  CHAT_CREATED = "chat-created",
}

// Define event data interfaces
export interface BaseEventData {
  timestamp?: string;
}

export interface ModuleEventData extends BaseEventData {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  [key: string]: unknown;
}

export interface ModuleDeletedEventData extends BaseEventData {
  id: string;
}

export interface ChatEventData extends BaseEventData {
  id: string;
  title: string;
  moduleId?: string | null;
  createdAt?: string | Date;
  [key: string]: unknown;
}

// Union type for all possible event data
export type EventData =
  | ModuleEventData
  | ModuleDeletedEventData
  | ChatEventData
  | BaseEventData;

// Types for SSE clients
type SseClient = {
  id: string;
  controller: ReadableStreamDefaultController;
  send: (data: { type: string; data: EventData; timestamp: string }) => void;
};

// Get access to the global SSE clients array
declare global {
  // eslint-disable-next-line no-var
  var sseClients: SseClient[];
}

// Initialize if not already done
if (typeof global !== "undefined" && !global.sseClients) {
  global.sseClients = [];
}

// Helper function to broadcast events to specific clients or all clients
export function broadcastEvent(
  event: EventType,
  data: EventData,
  targetIds?: string[]
) {
  if (
    typeof global === "undefined" ||
    !global.sseClients ||
    global.sseClients.length === 0
  )
    return;

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

// Helper to broadcast module events
export function broadcastModuleCreated(
  moduleData: ModuleEventData,
  targetIds?: string[]
) {
  broadcastEvent(EventType.MODULE_CREATED, moduleData, targetIds);
}

export function broadcastModuleUpdated(
  moduleData: ModuleEventData,
  targetIds?: string[]
) {
  broadcastEvent(EventType.MODULE_UPDATED, moduleData, targetIds);
}

export function broadcastModuleDeleted(moduleId: string, targetIds?: string[]) {
  broadcastEvent(EventType.MODULE_DELETED, { id: moduleId }, targetIds);
}

export function broadcastChatCreated(
  chatData: ChatEventData,
  targetIds?: string[]
) {
  broadcastEvent(EventType.CHAT_CREATED, chatData, targetIds);
}
