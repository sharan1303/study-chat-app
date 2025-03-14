"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useModuleStore } from "@/lib/store";
import { fetchModules } from "@/lib/api";
import Sidebar from "./Sidebar";
import { useAuth } from "@clerk/nextjs";

export default function ClientSidebar() {
  const { isLoaded, isSignedIn } = useAuth();
  const { modules, setModules, setLoading } = useModuleStore();
  const queryClient = useQueryClient();
  // Add manual activation state
  const [isActivated, setIsActivated] = useState(false);

  // Activate the component after mount
  useEffect(() => {
    // Immediate activation
    setIsActivated(true);
  }, []);

  // Only fetch if we're authenticated
  const enabled = isLoaded && isSignedIn && isActivated;

  // Use React Query to fetch modules with immediate execution
  const { data, isLoading } = useQuery({
    queryKey: ["modules"],
    queryFn: fetchModules,
    enabled: enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 2, // Poll every 2 minutes
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
      setModules(data);
      setLoading(false);
    } else if (!isLoading && isLoaded && isActivated) {
      // If we're not loading, and we're fully activated, set an empty array
      setModules([]);
      setLoading(false);
    }
  }, [data, isLoading, isLoaded, isActivated, setModules, setLoading]);

  // Manual loading control
  const loadingState = isLoading || !isActivated || !isLoaded;

  return <Sidebar modules={modules} loading={loadingState} />;
}
