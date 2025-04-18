"use client";

import { useEffect } from "react";
import {
  getOrCreateSessionIdClient,
  SESSION_ID_KEY,
  SESSION_COOKIE_NAME,
} from "@/lib/session";
import Cookies from "js-cookie";

// Client component to initialize session on page load
export function SessionInitializer() {
  useEffect(() => {
    // Initialize the anonymous session ID
    const initSession = async () => {
      try {
        // Try to get or create session ID
        const sessionId = getOrCreateSessionIdClient();
        console.log("Session initialized with ID:", sessionId);

        if (!sessionId) {
          console.error(
            "Session initialization failed - no session ID returned"
          );

          // Try manual recovery with cookies first, then localStorage
          try {
            // Check if cookies API is available
            if (typeof document !== "undefined") {
              // Create a fallback session ID
              const tempSessionId =
                crypto.randomUUID?.() ||
                Array.from(new Array(36), () =>
                  Math.floor(Math.random() * 16).toString(16)
                ).join("");

              // Try to set cookie directly
              Cookies.set(SESSION_COOKIE_NAME, tempSessionId, {
                path: "/",
                expires: 365,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
              });

              // Also set in localStorage as fallback
              try {
                if (typeof localStorage !== "undefined") {
                  localStorage.setItem(SESSION_ID_KEY, tempSessionId);
                }
              } catch (storageError) {
                console.error(
                  "Error using localStorage fallback:",
                  storageError
                );
              }
            }
          } catch (manualSetError) {
            console.error("Error manually setting session:", manualSetError);
          }
        }

        // Verify the session was stored - check cookie first, then localStorage
        try {
          const cookieSessionId = Cookies.get(SESSION_COOKIE_NAME);

          if (!cookieSessionId) {
            console.error("Failed to store session in cookies");

            // Check localStorage as fallback
            const storedSessionId = localStorage.getItem(SESSION_ID_KEY);
            if (storedSessionId) {
              // Try to restore cookie from localStorage
              Cookies.set(SESSION_COOKIE_NAME, storedSessionId, {
                path: "/",
                expires: 365,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
              });
            } else {
              // Retry once
              const retrySessionId = getOrCreateSessionIdClient();
            }
          }
        } catch (verifyError) {
          console.error("Error verifying session:", verifyError);
        }
      } catch (error) {
        console.error("Error initializing session:", error);
      }
    };

    initSession();
  }, []);

  // This component doesn't render anything
  return null;
}
