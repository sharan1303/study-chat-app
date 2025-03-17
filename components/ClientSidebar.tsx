"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Chat } from "./ChatHistory";
import useSWR from "swr";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/lib/sidebar-context";
import ModuleList from "./ModuleList";
import ChatHistory from "./ChatHistory";
import UserSection from "./UserSection";
import { useRouter, usePathname } from "next/navigation";

// Define module type
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
  const { state } = useSidebar();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

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

  // Return the new sidebar component structure
  return (
    <Sidebar side="left" collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center justify-between">
          {state === "expanded" && (
            <span className="text-xl font-bold">Study Chat</span>
          )}
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Show error message if there is one */}
        {error && state === "expanded" && (
          <div className="px-4 py-2 text-sm text-red-600 bg-red-50 rounded mb-2">
            <p className="font-semibold">Error loading modules:</p>
            <p className="text-xs break-words">{error}</p>
          </div>
        )}

        {/* Module List */}
        <div className={state === "expanded" ? "mb-4" : ""}>
          <ModuleList
            modules={modules}
            loading={loading}
            currentModule={activeModuleId}
            handleModuleClick={(moduleId) => setActiveModuleId(moduleId)}
            collapsed={state === "collapsed"}
            router={{ push: router.push, refresh: router.refresh }}
            pathname={pathname}
          />
        </div>

        {/* Chat History Section */}
        {state === "expanded" &&
          chats &&
          (chats.length > 0 || isLoadingChats) && (
            <div className="mt-2">
              <ChatHistory chats={chats || []} loading={isLoadingChats} />
            </div>
          )}
      </SidebarContent>

      {state === "expanded" && (
        <SidebarFooter>
          <UserSection />
        </SidebarFooter>
      )}

      <SidebarRail />
    </Sidebar>
  );
}
