"use client";

import { useEffect } from "react";
import { getOrCreateSessionIdClient, SESSION_ID_KEY } from "@/lib/session";

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

          // Check if localStorage is available
          try {
            if (typeof localStorage !== "undefined") {
              console.log("localStorage is available");
            } else {
              console.error("localStorage is not available");
            }
          } catch (storageError) {
            console.error("Error checking localStorage:", storageError);
          }

          // Try to manually set a session ID
          try {
            if (typeof localStorage !== "undefined") {
              const tempSessionId =
                crypto.randomUUID?.() ||
                Math.random().toString(36).substring(2, 15);
              localStorage.setItem(SESSION_ID_KEY, tempSessionId);
              console.log("Manually set session ID:", tempSessionId);
            }
          } catch (manualSetError) {
            console.error("Error manually setting session ID:", manualSetError);
          }
        }

        // Verify the session was stored
        let storedSessionId;
        try {
          storedSessionId = localStorage.getItem(SESSION_ID_KEY);
          console.log("Stored session ID:", storedSessionId);

          if (!storedSessionId) {
            console.error("Failed to store session ID in localStorage");
            // Retry once
            const retrySessionId = getOrCreateSessionIdClient();
            console.log("Retried session initialization:", retrySessionId);
          }
        } catch (verifyError) {
          console.error("Error verifying session ID:", verifyError);
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
