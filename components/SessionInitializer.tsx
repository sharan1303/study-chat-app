"use client";

import { useEffect } from "react";
import { getOrCreateSessionIdClient } from "@/lib/session";

// Client component to initialize session on page load
export function SessionInitializer() {
  useEffect(() => {
    // Initialize the anonymous session ID
    const initSession = async () => {
      try {
        // Try to get or create session ID
        const sessionId = getOrCreateSessionIdClient();
        console.log("Session initialized:", sessionId);

        // Verify the session was stored
        const storedSessionId = localStorage.getItem("anonymous_session_id");
        if (!storedSessionId) {
          console.error("Failed to store session ID in localStorage");
          // Retry once
          const retrySessionId = getOrCreateSessionIdClient();
          console.log("Retried session initialization:", retrySessionId);
        }

        // Verify we can read the session ID
        const verifySessionId = localStorage.getItem("anonymous_session_id");
        console.log("Verified stored session ID:", verifySessionId);
      } catch (error) {
        console.error("Error initializing session:", error);
      }
    };

    initSession();
  }, []);

  // This component doesn't render anything
  return null;
}
