"use client";

import { useEffect, useState, useRef, Suspense, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Chat } from "./ChatHistory";
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
import { encodeModuleSlug, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { api } from "@/lib/api";
import { EVENT_TYPES } from "@/lib/events";

// Define module type
export interface Module {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  lastStudied?: string | null;
  resourceCount?: number;
}

// Create a wrapper component for useSearchParams
function SearchParamsWrapper({
  children,
}: {
  children: (searchParams: URLSearchParams) => React.ReactNode;
}) {
  const searchParams = useSearchParams();
  return <>{children(searchParams)}</>;
}

// Main sidebar component that accepts searchParams as a prop
function ClientSidebarContent({
  searchParams,
}: {
  searchParams: URLSearchParams;
}) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { state } = useSidebar();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const eventSourceRef = useRef<EventSource | null>(null);

  // State for chat history
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  // Get active module from URL if not provided in props
  const currentModule = searchParams?.get("module") || null;

  // Update the activeModuleId when it changes
  useEffect(() => {
    if (currentModule) {
      setActiveModuleId(currentModule);
    }
  }, [currentModule]);

  // Fetch modules function - memoized with useCallback
  const fetchModules = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return { modules: [] };

    try {
      console.log(`Fetching modules for sidebar`);
      const data = await api.getModules();
      return data;
    } catch (error) {
      console.error("Error fetching modules:", error);
      return { modules: [] };
    }
  }, [isLoaded, isSignedIn]);

  // Fetch chat history function - memoized with useCallback
  const fetchChats = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    console.log("Fetching chats...");
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const url = `/api/chat/history?t=${timestamp}`;
      console.log(`Requesting chats from: ${url}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!response.ok) {
        console.error(`Chat fetch failed with status: ${response.status}`);
        return [];
      }

      const data = await response.json();
      console.log(
        `Fetch successful, received ${data.length} chats with data:`,
        data
      );
      return data;
    } catch (error) {
      console.error("Error fetching chats:", error);
      return [];
    }
  }, [isLoaded, isSignedIn]);

  // Refresh chat history function - memoized with useCallback
  const refreshChatHistory = useCallback(async () => {
    console.log("Refreshing chat history...");
    setLoadingChats(true);
    try {
      const chatData = await fetchChats();
      if (chatData) {
        console.log(`Retrieved ${chatData.length} chats`);
        // Force a new array reference to trigger re-render
        setChats([...chatData]);
      }
    } catch (error) {
      console.error("Error refreshing chat history:", error);
    } finally {
      setLoadingChats(false);
    }
  }, [fetchChats]);

  // Determine if a module is active (either in /modules/[name] or /[name]/chat)
  const isModuleActive = (moduleName: string) => {
    if (!pathname) return false;

    const encodedName = encodeModuleSlug(moduleName);
    return (
      pathname.startsWith(`/modules/${encodedName}`) ||
      pathname.startsWith(`/${encodedName}/chat`)
    );
  };

  // Set up Server-Sent Events (SSE) for real-time updates
  useEffect(() => {
    if (!isLoaded) return;

    let url = `/api/events`;
    if (userId) {
      url += `?userId=${userId}`;
    }

    let es: EventSource | null = null;

    // Create a new EventSource if it doesn't exist, or reuse existing one
    if (eventSourceRef.current) {
      es = eventSourceRef.current;
    } else {
      if (typeof window !== "undefined") {
        es = new EventSource(url);
        eventSourceRef.current = es;
      }
    }

    if (es) {
      // Set up error handler
      es.onerror = () => {
        // Close the connection if it's in an error state
        if (es && es.readyState === EventSource.CLOSED) {
          es.close();
          eventSourceRef.current = null;

          // Try to reconnect after a delay
          setTimeout(() => {
            if (typeof window !== "undefined") {
              const newEs = new EventSource(url);
              eventSourceRef.current = newEs;
            }
          }, 3000);
        }
      };

      // Set up message handler for general messages
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("SSE event received:", data.type);

          // Handle different event types
          if (data.type === "CONNECTION_ACK") {
            // Connection confirmed by server
          } else if (data.type === "HEARTBEAT") {
            // Server heartbeat received
          } else if (data.type === "chat.created") {
            // Handle chat creation - redirect to the chat page
            const chatData = data.data;
            console.log("Chat created event received:", chatData);

            if (chatData && chatData.id) {
              console.log("Chat created event received with ID:", chatData.id);

              // Refresh chat list when a new chat is created
              refreshChatHistory();

              // Only redirect if we're on the main chat page (new chat)
              if (pathname === "/chat") {
                router.push(`/chat/${chatData.id}`);
              }
            } else {
              console.error("Invalid chat data in event:", data);
            }
          } else if (data.type === "message.created") {
            // Handle new message creation event
            const messageData = data.data;
            console.log("Message created event received:", messageData);

            if (messageData && messageData.chatId) {
              console.log("Message created for chat ID:", messageData.chatId);

              // Refresh chat list to update chat titles and timestamps
              console.log("Triggering chat history refresh due to new message");
              setTimeout(() => {
                refreshChatHistory();
              }, 500); // Small delay to ensure DB has updated
            } else {
              console.error("Invalid message data in event:", data);
            }
          } else if (
            data.type === EVENT_TYPES.MODULE_CREATED ||
            data.type === EVENT_TYPES.MODULE_UPDATED
          ) {
            // Fetch updated modules list
            fetchModules().then((data) => {
              if (data.modules) {
                setModules(data.modules);
              }
            });
          } else if (data.type === EVENT_TYPES.MODULE_DELETED) {
            // Remove the deleted module from the list
            setModules((prevModules) =>
              prevModules.filter((module) => module.id !== data.data.id)
            );
          } else {
            // Unknown event type
            console.log("Unknown event type received:", data.type);
          }
        } catch (error) {
          // Log parsing errors
          console.error("Error parsing SSE event:", error, event.data);
        }
      };
    }

    // Set up a keepalive timer to ensure the connection stays active
    const keepaliveTimer = setInterval(() => {
      if (es && es.readyState === EventSource.OPEN) {
        try {
          // Send a ping to keep the connection alive
          fetch("/api/events/ping").catch(() => {
            // If ping fails, close and reconnect
            if (es) {
              es.close();
              eventSourceRef.current = null;
            }
          });
        } catch {
          // Silently handle ping errors
        }
      }
    }, 30000);

    // Clean up on unmount or when dependencies change
    return () => {
      clearInterval(keepaliveTimer);

      // Only close the EventSource if the page is unloading
      if (typeof window !== "undefined" && window.onbeforeunload) {
        if (es) {
          es.close();
          eventSourceRef.current = null;
        }
      }
    };
  }, [isLoaded, userId, pathname, router, refreshChatHistory]);

  // Initial data fetching
  useEffect(() => {
    if (!isLoaded) return;

    // Fetch modules and chats on initial load
    fetchModules()
      .then((data) => {
        if (data.modules) {
          setModules(data.modules);
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(`Failed to load modules: ${err.message}`);
        setLoading(false);
      });

    // Fetch initial chat history
    refreshChatHistory();
  }, [isLoaded, isSignedIn, fetchModules, refreshChatHistory]);

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

  // Handle module click - this clarifies why we're tracking activeModuleId
  const handleModuleClick = (
    moduleId: string,
    moduleName: string | undefined
  ) => {
    // Set active module ID for highlighting in the UI
    setActiveModuleId(moduleId);

    if (moduleName) {
      // Navigate to module chat with just module name in URL
      router.push(`/${encodeModuleSlug(moduleName)}/chat`);
    }
  };

  // Return the new sidebar component structure
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
            <SidebarTrigger />
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
            currentModule={currentModule || activeModuleId}
            isActive={isModuleActive}
            handleModuleClick={handleModuleClick}
            collapsed={state === "collapsed"}
            router={{ push: router.push, refresh: router.refresh }}
            pathname={pathname}
          />
        </div>

        {/* Chat History Section */}
        {state === "expanded" && (
          <div className="h-2/3 min-h-[200px]">
            <ChatHistory
              chats={chats}
              loading={loadingChats}
              onRefresh={refreshChatHistory}
            />
          </div>
        )}
      </SidebarContent>

      {state === "expanded" && (
        <SidebarFooter className="p-0">
          {/* {process.env.NODE_ENV === "development" && (
            <div className="px-4 py-2 border-t space-y-2">
              <p className="text-xs font-semibold">Debug Tools</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => refreshChatHistory()}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh Chats
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={async () => {
                    try {
                      const response = await fetch(
                        `/api/events/ping?broadcast=true${
                          userId ? `&userId=${userId}` : ""
                        }`
                      );
                      const data = await response.json();
                      console.log("Test event sent:", data);
                    } catch (error) {
                      console.error("Error sending test event:", error);
                    }
                  }}
                >
                  Test Event
                </Button>
              </div>
            </div>
          )} */}
          <UserSection />
        </SidebarFooter>
      )}

      <SidebarRail />
    </Sidebar>
  );
}

// Export the ClientSidebar with Suspense wrapper
export default function ClientSidebar() {
  return (
    <Suspense fallback={null}>
      <SearchParamsWrapper>
        {(searchParams) => <ClientSidebarContent searchParams={searchParams} />}
      </SearchParamsWrapper>
    </Suspense>
  );
}
