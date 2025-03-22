"use client";

import { useEffect } from "react";
import { getOrCreateSessionIdClient } from "@/lib/session";

// Client component to initialize session on page load
export function SessionInitializer() {
  useEffect(() => {
    // Initialize the anonymous session ID
    const sessionId = getOrCreateSessionIdClient();
    console.log("Session initialized:", sessionId);
  }, []);

  // This component doesn't render anything
  return null;
}
