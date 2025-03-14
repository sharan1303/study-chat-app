"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useModuleStore } from "@/lib/store";
import { fetchModules } from "@/lib/api";
import Sidebar from "./Sidebar";
import { useAuth } from "@clerk/nextjs";

export default function ClientSidebar() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { modules, setModules, setLoading } = useModuleStore();
  const queryClient = useQueryClient();
  const [isActivated, setIsActivated] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Activate the component after mount
  useEffect(() => {
    // Immediate activation
    setIsActivated(true);
  }, []);

  // Only fetch if we're authenticated
  const enabled = isLoaded && isSignedIn && isActivated;

  // Use React Query to fetch modules with more debugging
  const { data, isLoading, error } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      try {
        console.log("Fetching modules for user:", userId);
        const result = await fetchModules();
        console.log("Fetched modules result:", result);
        return result;
      } catch (err) {
        console.error("Error in fetchModules query:", err);
        setFetchError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    enabled: enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 2, // Poll every 2 minutes
    retry: 3, // Retry failed requests 3 times
  });

  // Set up periodic refetching
  useEffect(() => {
    // Force an immediate fetch when component mounts
    if (enabled) {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    }

    const interval = setInterval(() => {
      if (enabled) {
        queryClient.invalidateQueries({ queryKey: ["modules"] });
      }
    }, 1000 * 60 * 5); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [queryClient, enabled]);

  // Update our store when data changes
  useEffect(() => {
    if (data) {
      console.log("Setting modules data:", data);
      setModules(data);
      setLoading(false);
      setFetchError(null); // Clear any previous errors
    } else if (!isLoading && isLoaded && isActivated) {
      // If we're not loading, and we're fully activated, set an empty array
      if (error) {
        console.error("Error loading modules:", error);
        setFetchError(error instanceof Error ? error.message : String(error));
      }
      setModules([]);
      setLoading(false);
    }
  }, [data, isLoading, isLoaded, isActivated, error, setModules, setLoading]);

  // Manual loading control
  const loadingState = isLoading || !isActivated || !isLoaded;

  // If there's a fetch error and no modules, add debugging info
  useEffect(() => {
    if (fetchError && modules.length === 0 && !loadingState) {
      console.error(`Module fetch error: ${fetchError}`);
      // This adds debug info to the console in production
    }
  }, [fetchError, modules.length, loadingState]);

  return (
    <>
      <Sidebar modules={modules} loading={loadingState} />
      {fetchError && modules.length === 0 && !loadingState && (
        <div className="hidden">Module fetch error: {fetchError}</div>
      )}
    </>
  );
}
