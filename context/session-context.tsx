"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { getOrCreateSessionIdClient, SESSION_COOKIE_NAME } from "@/lib/session";

interface SessionContextType {
  sessionId: string | null;
  isLoading: boolean;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType>({
  sessionId: null,
  isLoading: true,
  clearSession: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session ID on mount
  useEffect(() => {
    // Get session ID from our client-side function
    const currentSessionId = getOrCreateSessionIdClient();
    setSessionId(currentSessionId);
    setIsLoading(false);
  }, []);

  // Memoize clearSession to avoid unnecessary re-renders
  const clearSession = useCallback(() => {
    if (typeof document !== "undefined") {
      // Clear the cookie by setting its expiration date to the past
      document.cookie = `${SESSION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      setSessionId(null);
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      sessionId,
      isLoading,
      clearSession,
    }),
    [sessionId, isLoading, clearSession]
  );

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
