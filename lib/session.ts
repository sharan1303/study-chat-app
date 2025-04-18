"use client";

import { v4 as uuid } from "uuid";
import Cookies from "js-cookie";

// Session storage constants
export const SESSION_ID_KEY = "anonymous_session_id"; // For localStorage fallback
export const SESSION_COOKIE_NAME = "study_chat_session";

// Cookie options
const COOKIE_OPTIONS = {
  path: "/",
  expires: 365, // 1 year
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

/**
 * Gets or creates a session ID using secure cookies with localStorage fallback
 */
export function getOrCreateSessionIdClient(): string {
  if (typeof window === "undefined") {
    console.warn("getOrCreateSessionIdClient called on server side");
    return "";
  }

  try {
    // Check for existing session ID in cookies first
    let sessionId = Cookies.get(SESSION_COOKIE_NAME);

    // If no session ID in cookies, check localStorage as fallback
    if (!sessionId) {
      try {
        const storedId = localStorage.getItem(SESSION_ID_KEY);
        if (storedId) {
          sessionId = storedId;
          // Migrate localStorage session to cookie for better security
          Cookies.set(SESSION_COOKIE_NAME, sessionId, COOKIE_OPTIONS);
        }
      } catch (error) {
        // Ignore localStorage errors
      }
    }

    // If no session ID exists anywhere, create one
    if (!sessionId) {
      sessionId = uuid();
      // Set in cookie with proper security options
      Cookies.set(SESSION_COOKIE_NAME, sessionId, COOKIE_OPTIONS);

      // Also store in localStorage as fallback
      try {
        localStorage.setItem(SESSION_ID_KEY, sessionId);
      } catch (error) {
        // Ignore localStorage errors, we have cookies as primary storage
      }
    }

    return sessionId;
  } catch (error) {
    console.error("Error in getOrCreateSessionIdClient:", error);
    return "";
  }
}

/**
 * Gets the current session ID prioritizing cookies over localStorage
 */
export function getSessionIdClient(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    // Try cookies first (more secure)
    const cookieSessionId = Cookies.get(SESSION_COOKIE_NAME);
    if (cookieSessionId) {
      return cookieSessionId;
    }

    // Fallback to localStorage if no cookie exists
    try {
      const localStorageSessionId = localStorage.getItem(SESSION_ID_KEY);
      if (localStorageSessionId) {
        // Found in localStorage but not in cookies, restore to cookies
        Cookies.set(SESSION_COOKIE_NAME, localStorageSessionId, COOKIE_OPTIONS);
        return localStorageSessionId;
      }
    } catch (error) {
      // Ignore localStorage errors
    }

    return "";
  } catch (error) {
    console.error("Error getting session ID:", error);
    return "";
  }
}

/**
 * Removes the session ID from both cookies and localStorage
 */
export function clearSessionId(): void {
  try {
    Cookies.remove(SESSION_COOKIE_NAME, { path: "/" });
    localStorage.removeItem(SESSION_ID_KEY);
  } catch (error) {
    console.error("Error clearing session ID:", error);
  }
}
