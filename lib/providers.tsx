"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, ReactNode, useEffect, useRef } from "react";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: ReactNode }) {
  // Use a ref for the client to avoid recreation on each render
  const queryClientRef = useRef<QueryClient>();
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          refetchOnWindowFocus: true,
          refetchOnMount: true,
          retry: 1,
          // Ensure React Query eagerly executes queries
          refetchOnReconnect: "always",
        },
      },
    });
  }

  // Force component activation with a simple state update
  const [isActivated, setIsActivated] = useState(false);
  useEffect(() => {
    if (!isActivated) {
      setIsActivated(true);
    }
  }, [isActivated]);

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
