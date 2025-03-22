"use client";

import { v4 as uuid } from "uuid";

// Session storage key
export const SESSION_ID_KEY = "anonymous_session_id";
// Session cookie name for client-side cookie management
export const SESSION_COOKIE_NAME = "study_app_session";

/**
 * Gets or creates a session ID on the client side using localStorage
 */
export function getOrCreateSessionIdClient(): string {
  if (typeof window === "undefined") {
    return "";
  }

  // Check localStorage for existing session ID
  let sessionId = localStorage.getItem(SESSION_ID_KEY);

  // If no session ID exists, create one
  if (!sessionId) {
    sessionId = uuid();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Gets the current session ID from localStorage
 */
export function getSessionIdClient(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(SESSION_ID_KEY) || "";
}
