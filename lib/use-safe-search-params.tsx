"use client";

import { useSearchParams as useNextSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

// Empty params for initial state
const emptyParams = new URLSearchParams();

/**
 * Safe wrapper around useSearchParams that handles suspense boundaries
 * and avoids the "useSearchParams should be wrapped in suspense" error
 */
export function useSearchParamsSafe() {
  // Always call the hook unconditionally to satisfy React's rules of hooks
  const nextSearchParams = useNextSearchParams();

  // Track if we're on the client side
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Return either the actual params or empty params
  return isClient ? nextSearchParams : emptyParams;
}

/**
 * Component wrapper for cases where you need to use useSearchParams directly
 */
export function SearchParamsProvider({
  children,
  fallback = <div>Loading...</div>,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      <SearchParamsConsumer>{children}</SearchParamsConsumer>
    </Suspense>
  );
}

function SearchParamsConsumer({ children }: { children: React.ReactNode }) {
  useNextSearchParams(); // This will trigger suspense
  return <>{children}</>;
}
