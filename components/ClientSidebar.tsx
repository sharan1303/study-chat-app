"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useModuleStore } from "@/lib/store";
import { fetchModules } from "@/lib/api";
import Sidebar from "./Sidebar";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

export default function ClientSidebar() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { modules, setModules, setLoading } = useModuleStore();
  const queryClient = useQueryClient();
  const [isActivated, setIsActivated] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Activate the component after mount
  useEffect(() => {
    setIsActivated(true);

    // Detect production environment
    if (typeof window !== "undefined") {
      console.log(
        "Environment:",
        process.env.NODE_ENV,
        "User authenticated:",
        isSignedIn,
        "User ID:",
        userId
      );
    }
  }, [isSignedIn, userId]);

  // Only fetch if we're authenticated
  const enabled = isLoaded && isSignedIn && isActivated;

  // Direct fetch without React Query (as a fallback)
  useEffect(() => {
    // If React Query isn't working, try a direct fetch as fallback
    if (enabled && modules.length === 0 && fetchError) {
      console.log("Attempting direct fetch as fallback");

      const directFetch = async () => {
        try {
          const response = await fetch("/api/modules", {
            headers: {
              "Cache-Control": "no-store",
            },
          });

          if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
          }

          const data = await response.json();
          console.log("Direct fetch result:", data);

          if (data.modules && Array.isArray(data.modules)) {
            setModules(data.modules);
            setLoading(false);
            if (data.modules.length > 0) {
              toast.success(
                `Loaded ${data.modules.length} modules via direct fetch`
              );
            } else {
              console.log("No modules found via direct fetch");
            }
          }
        } catch (err) {
          console.error("Direct fetch failed:", err);
        }
      };

      directFetch();
    }
  }, [enabled, modules.length, fetchError, setModules, setLoading]);

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
      if (error) {
        console.error("Error loading modules:", error);
        setFetchError(error instanceof Error ? error.message : String(error));
      }

      // Don't clear modules if we already have some
      if (modules.length === 0) {
        setModules([]);
        setLoading(false);
      }
    }
  }, [
    data,
    isLoading,
    isLoaded,
    isActivated,
    error,
    modules.length,
    setModules,
    setLoading,
  ]);

  // Manual loading control
  const loadingState = isLoading || !isActivated || !isLoaded;

  // If there's a fetch error and no modules, add debugging info
  useEffect(() => {
    if (fetchError && modules.length === 0 && !loadingState) {
      console.error(`Module fetch error: ${fetchError}`);
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
