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

  // Determine if a navigation item is active
  const isActive = (path: string) => {
    return pathname === path;
  };

  // Determine if a module is active (either in /modules/[name] or /[name]/chat)
  const isModuleActive = (moduleName: string) => {
    if (!pathname) return false;

    const encodedName = encodeModuleSlug(moduleName);
    return (
      pathname.startsWith(`/modules/${encodedName}`) ||
      pathname.startsWith(`/${encodedName}/chat`)
    );
  };

  // Fetch modules whenever auth state changes
  useEffect(() => {
    if (!isLoaded) return;

    const fetchModules = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`Fetching modules for sidebar`);

        // Get sessionId for anonymous users
        let url = "/api/modules?source=sidebar";
        if (!isSignedIn) {
          const sessionId = localStorage.getItem("anonymous_session_id");
          if (sessionId) {
            url = `/api/modules?source=sidebar&sessionId=${sessionId}`;
          }
        }

        // Request modules
        const response = await fetch(url, {
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

    // Set up polling
    let interval: NodeJS.Timeout | null = null;
    interval = setInterval(fetchModules, 60000); // Poll every minute

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoaded, isSignedIn]);

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
