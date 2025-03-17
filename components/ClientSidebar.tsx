"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Chat } from "./ChatHistory";
import useSWR from "swr";

// Define module type matching ServerSidebar
export interface Module {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  lastStudied?: string | null;
  resourceCount?: number;
}

// SWR fetcher function
const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    return res.json();
  });

export default function ClientSidebar() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch chat history using SWR
  const { data: chats, isLoading: isLoadingChats } = useSWR<Chat[]>(
    isSignedIn ? "/api/chat/history" : null,
    fetcher
  );

  // Fetch modules whenever auth state changes
  useEffect(() => {
    if (!isLoaded) return;

    const fetchModules = async () => {
      if (!isSignedIn || !userId) {
        console.log("User not signed in or no userId, skipping modules fetch");
        setModules([]);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`Fetching modules for sidebar (userId: ${userId})`);

        // Request modules directly, like ServerSidebar does
        const response = await fetch("/api/modules?source=sidebar", {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Failed to fetch modules: ${response.status}`,
            errorText
          );
          setError(`API Error (${response.status}): ${errorText}`);
          throw new Error(
            `Failed to fetch modules: ${response.status} - ${errorText}`
          );
        }

        const data = await response.json();

        if (data && data.modules && Array.isArray(data.modules)) {
          console.log(`Loaded ${data.modules.length} modules`);
          setModules(data.modules);
        } else {
          console.warn("Unexpected modules data format:", data);
          setError("Unexpected data format from API");
          setModules([]);
        }
      } catch (error) {
        console.error("Error fetching modules for sidebar:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        toast.error("Failed to load modules");
        setModules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();

    // Set up polling if user is signed in
    let interval: NodeJS.Timeout | null = null;
    if (isSignedIn && userId) {
      interval = setInterval(fetchModules, 60000); // Poll every minute
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoaded, isSignedIn, userId]);

  // Listen for module creation/update events
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "module-created" || event.key === "module-updated") {
        console.log("Module change detected - reloading");
        window.location.reload();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Show auth debug info in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("Auth state:", { isLoaded, isSignedIn, userId });
    }
  }, [isLoaded, isSignedIn, userId]);

  // Return the sidebar component with modules and error state
  return (
    <Sidebar
      modules={modules}
      loading={loading}
      errorMessage={error}
      chats={chats || []}
      chatsLoading={isLoadingChats}
    />
  );
}
