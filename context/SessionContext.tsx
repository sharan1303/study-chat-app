"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';

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

  useEffect(() => {
    // Try to get sessionId from localStorage
    const storedSessionId = localStorage.getItem('anonymous_session_id');
    
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      // Create a new sessionId and store it
      const newSessionId = uuidv4();
      localStorage.setItem('anonymous_session_id', newSessionId);
      setSessionId(newSessionId);
    }
    
    setIsLoading(false);
  }, []);

  const clearSession = () => {
    localStorage.removeItem('anonymous_session_id');
    setSessionId(null);
  };

  return (
    <SessionContext.Provider value={{ sessionId, isLoading, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
