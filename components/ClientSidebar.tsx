"use client";

import { useEffect, useState, useRef } from "react";
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
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { encodeModuleSlug } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { fetcher, swrConfig } from "@/lib/swr-config";
import { api } from "@/lib/api";
import { EventType } from "@/lib/events";

// Define module type
export interface Module {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  lastStudied?: string | null;
  resourceCount?: number;
}

export default function ClientSidebar() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { state } = useSidebar();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch chat history using SWR with our optimized config
  const { data: chats, isLoading: isLoadingChats } = useSWR<Chat[]>(
    isSignedIn ? "/api/chat/history" : null,
    fetcher,
    {
      ...swrConfig,
      // Override specific options as needed
      suspense: false, // Don't use suspense for the sidebar
    }
  );

  // Get active module from URL if not provided in props
  const currentModule = searchParams?.get("module") || null;

  // Update the activeModuleId when it changes
  useEffect(() => {
    if (currentModule) {
      setActiveModuleId(currentModule);
    }
  }, [currentModule]);

  // Add an effect to report the active module ID when it changes
  useEffect(() => {
    if (activeModuleId && typeof window !== "undefined") {
      // This could be expanded in the future to implement chat history
      console.log(`Active module changed to: ${activeModuleId}`);

      // Store the last active module ID in localStorage
      localStorage.setItem("lastActiveModuleId", activeModuleId);
    }
  }, [activeModuleId]);

  // Determine if a module is active (either in /modules/[name] or /[name]/chat)
  const isModuleActive = (moduleName: string) => {
    if (!pathname) return false;

    const encodedName = encodeModuleSlug(moduleName);
    return (
      pathname.startsWith(`/modules/${encodedName}`) ||
      pathname.startsWith(`/${encodedName}/chat`)
    );
  };

  // Initialize SSE connection for real-time updates
  useEffect(() => {
    if (!isLoaded) return;

    const setupEventSource = () => {
      // Clean up any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        // Determine the URL based on auth status
        const url = isSignedIn
          ? `/api/events`
          : `/api/events?sessionId=${localStorage.getItem(
              "anonymous_session_id"
            )}`;

        // Create a new event source
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        // Handle connection open
        eventSource.onopen = () => {
          console.log("SSE connection established");
        };

        // Handle events
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("SSE event received:", data);

            // Handle different event types
            if (
              data.type === EventType.MODULE_CREATED ||
              data.type === EventType.MODULE_UPDATED
            ) {
              // Fetch updated modules list
              fetchModules();
            } else if (data.type === EventType.MODULE_DELETED) {
              // Remove the deleted module from the list
              setModules((prevModules) =>
                prevModules.filter((module) => module.id !== data.data.id)
              );
            } else if (data.type === EventType.CHAT_CREATED) {
              // No need to reload modules for chat updates, handled by SWR
            }
          } catch (error) {
            console.error("Error processing SSE event:", error);
          }
        };

        // Handle errors
        eventSource.onerror = (error) => {
          console.error("SSE connection error:", error);
          // Attempt to reconnect after a short delay
          setTimeout(setupEventSource, 5000);
        };
      } catch (error) {
        console.error("Error setting up SSE connection:", error);
      }
    };

    setupEventSource();

    // Clean up on component unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isLoaded, isSignedIn]);

  // Fetch modules function - can be called on-demand or by SSE events
  const fetchModules = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching modules for sidebar`);

      const data = await api.getModules();

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

  // Fetch modules once on initial load
  useEffect(() => {
    if (!isLoaded) return;
    fetchModules();
  }, [isLoaded, isSignedIn]);

  // Show auth debug info in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("Auth state:", { isLoaded, isSignedIn, userId });
    }
  }, [isLoaded, isSignedIn, userId]);

  // Get header height for positioning expand button
  const headerRef = useRef<HTMLDivElement>(null);
  const [, setHeaderHeight] = useState(0);

  // Measure header height on mount and resize
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight / 2);
    }

    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight / 2);
      }
    };

    window.addEventListener("resize", updateHeaderHeight);
    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, []);

  // Return the new sidebar component structure with old functionality
  return (
    <Sidebar
      side="left"
      collapsible="offcanvas"
      className="peer bg-[hsl(var(--sidebar-background))]"
    >
      <SidebarHeader className="px-4 py-3 border-b" ref={headerRef}>
        <div
          className={cn(
            "flex items-center relative z-50",
            state === "expanded" ? "justify-between" : "justify-center"
          )}
        >
          {state === "expanded" && (
            <Link href="/chat" className="text-xl font-bold">
              Study Chat
            </Link>
          )}
          <div
            className={cn(
              "flex items-center gap-1",
              state === "collapsed" &&
                "fixed left-[0.75rem] top-3 bg-[hsl(var(--sidebar-background))] rounded-md"
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/chat")}
              title="New chat"
              className={cn(
                "h-9 w-9",
                state === "collapsed" && "bg-[hsl(var(--sidebar-background))]"
              )}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <SidebarTrigger />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-0">
        {/* Show error message if there is one */}
        {error && state === "expanded" && (
          <div className="px-4 py-2 mt-2 text-sm text-red-600 bg-red-50 rounded mx-2 mb-2">
            <p className="font-semibold">Error loading modules:</p>
            <p className="text-xs break-words">{error}</p>
          </div>
        )}

        {/* Module List */}
        <div className={state === "expanded" ? "h-1/3 min-h-[150px]" : ""}>
          <ModuleList
            modules={modules}
            loading={loading}
            currentModule={currentModule}
            isActive={isModuleActive}
            handleModuleClick={(moduleId, moduleName) => {
              setActiveModuleId(moduleId);
              if (moduleName) {
                // Navigate to module chat
                router.push(`/${encodeModuleSlug(moduleName)}/chat`);
              }
            }}
            collapsed={state === "collapsed"}
            router={{ push: router.push, refresh: router.refresh }}
            pathname={pathname}
          />
        </div>

        {/* Chat History Section */}
        {state === "expanded" && (
          <div className="h-2/3">
            <ChatHistory
              chats={chats ?? []}
              loading={Boolean(isSignedIn) && (!chats || isLoadingChats)}
            />
          </div>
        )}
      </SidebarContent>

      {state === "expanded" && (
        <SidebarFooter className="p-0">
          <UserSection />
        </SidebarFooter>
      )}

      <SidebarRail />
    </Sidebar>
  );
}
