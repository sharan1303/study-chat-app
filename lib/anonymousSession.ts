import { getSessionIdClient } from "./session";

// Constants
const SESSION_ID_KEY = "study_chat_session_id";

/**
 * Generates a random session ID for anonymous users
 */
function generateSessionId(): string {
  // Generate a random string with timestamp for uniqueness
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get an existing session ID from localStorage or create a new one if none exists
 *
 * @returns The session ID string
 */
export function getOrCreateSessionId(): string {
  // Only run on client
  if (typeof window === "undefined") {
    return "";
  }

  try {
    // Try to get from localStorage
    let sessionId = localStorage.getItem(SESSION_ID_KEY);

    // If no session ID exists, create one
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem(SESSION_ID_KEY, sessionId);
      console.log("Created new anonymous session ID:", sessionId);
    } else {
      console.log("Using existing anonymous session ID:", sessionId);
    }

    return sessionId;
  } catch (error) {
    // Handle localStorage errors (private browsing, etc.)
    console.error("Error accessing localStorage for session ID:", error);

    // Return a temporary session ID that won't persist
    return generateSessionId();
  }
}

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
