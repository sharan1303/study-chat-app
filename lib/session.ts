"use client";

import { v4 as uuid } from "uuid";

// Session storage key
export const SESSION_ID_KEY = "anonymous_session_id";
// Session cookie name for client-side cookie management
export const SESSION_COOKIE_NAME = "study_chat_session";

/**
 * Gets or creates a session ID on the client side using localStorage
 */
export function getOrCreateSessionIdClient(): string {
  if (typeof window === "undefined") {
    console.warn("getOrCreateSessionIdClient called on server side");
    return "";
  }

  try {
    // Check localStorage for existing session ID
    let sessionId = localStorage.getItem(SESSION_ID_KEY);

    // If no session ID exists, create one
    if (!sessionId) {
      sessionId = uuid();
      try {
        localStorage.setItem(SESSION_ID_KEY, sessionId);
        // Verify the session was stored
        const verifySessionId = localStorage.getItem(SESSION_ID_KEY);
        if (verifySessionId !== sessionId) {
          console.error("Failed to store session ID in localStorage");
          return "";
        }
      } catch (error) {
        console.error("Error storing session ID in localStorage:", error);
        return "";
      }
    }

    // Set cookie attributes for cross-environment compatibility
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // Determine appropriate cookie settings based on environment
    const secure = !isLocalhost; // Only use Secure in production
    const sameSite = "Lax"; // Good default for most applications

    // Also store in a cookie as backup with proper security settings
    document.cookie = `${SESSION_COOKIE_NAME}=${sessionId}; path=/; max-age=31536000; ${
      secure ? "Secure;" : ""
    } SameSite=${sameSite}`; // 1 year

    return sessionId;
  } catch (error) {
    console.error("Error in getOrCreateSessionIdClient:", error);
    return "";
  }
}

/**
 * Gets the current session ID from localStorage
 */
export function getSessionIdClient(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    // Try localStorage first
    const localStorageSessionId = localStorage.getItem(SESSION_ID_KEY);
    if (localStorageSessionId) {
      return localStorageSessionId;
    }

    // If not in localStorage, try cookie
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === SESSION_COOKIE_NAME && value) {
        // Found in cookie, restore to localStorage
        localStorage.setItem(SESSION_ID_KEY, value);
        return value;
      }
    }

    return "";
  } catch (error) {
    console.error("Error getting session ID:", error);
    return "";
  }
}
