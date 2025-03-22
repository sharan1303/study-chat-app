import { getSessionIdClient } from "./session";

/**
 * Gets the current session ID from cookies or creates a new one
 * @deprecated Use getSessionIdClient from lib/session instead
 */
export const getOrCreateSessionId = getSessionIdClient;

/**
 * Clears the anonymous session ID
 * @deprecated Use document.cookie API directly
 */
export function clearSessionId(): void {
  if (typeof document !== "undefined") {
    document.cookie = `study_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}

/**
 * Check if an anonymous session exists
 * @deprecated Use getSessionIdClient from lib/session instead
 */
export function hasSessionId(): boolean {
  return !!getSessionIdClient();
}

/**
 * Add session ID to API requests if available
 * @deprecated Use the api client from lib/api instead
 */
export function addSessionIdToRequest(url: string): string {
  const sessionId = getSessionIdClient();
  if (!sessionId) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}sessionId=${sessionId}`;
}
