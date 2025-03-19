import { v4 as uuidv4 } from "uuid";

/**
 * Gets the current session ID from localStorage or creates a new one
 */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  let sessionId = localStorage.getItem("anonymous_session_id");

  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem("anonymous_session_id", sessionId);
  }

  return sessionId;
}

/**
 * Clears the anonymous session ID from localStorage
 */
export function clearSessionId(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("anonymous_session_id");
}

/**
 * Check if an anonymous session exists
 */
export function hasSessionId(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return !!localStorage.getItem("anonymous_session_id");
}

/**
 * Add session ID to API requests if available
 */
export function addSessionIdToRequest(url: string): string {
  if (typeof window === "undefined") {
    return url;
  }

  const sessionId = localStorage.getItem("anonymous_session_id");
  if (!sessionId) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}sessionId=${sessionId}`;
}
