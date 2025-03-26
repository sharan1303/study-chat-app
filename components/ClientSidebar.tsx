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
    if (!isLoaded) return { modules: [] };

    try {
      console.log(`Fetching modules for sidebar`);
      const data = await api.getModules();
      return data;
    } catch (error) {
      console.error("Error fetching modules:", error);
      return { modules: [] };
    }
  }, [isLoaded]);

  // Fetch chat history function - memoized with useCallback
  const fetchChats = useCallback(async () => {
    if (!isLoaded) return;

    console.log("Fetching chats...");
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      let url = `/api/chat/history?t=${timestamp}`;

      // For anonymous users, add the sessionId
      if (!isSignedIn) {
        const sessionId = localStorage.getItem("anonymous_session_id");
        if (sessionId) {
          url += `&sessionId=${sessionId}`;
          console.log(
            `Requesting chats for anonymous user with sessionId: ${sessionId}`
          );
        } else {
          console.log(
            "No session ID found for anonymous user, returning empty chats"
          );
          return [];
        }
      }

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
      console.log(`Fetch successful, received ${data.length} chats`);

      // Sort chats by updatedAt date (newest first)
      const sortedChats = [...data].sort((a, b) => {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });

      console.log("Chats sorted by most recent first");
      return sortedChats;
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

    // Add either userId for authenticated users or get sessionId for anonymous users
    if (userId) {
      url += `?userId=${userId}`;
    } else {
      // For anonymous users, get the session ID from localStorage
      const sessionId = localStorage.getItem("anonymous_session_id");
      if (sessionId) {
        url += `?sessionId=${sessionId}`;
      } else {
        console.warn("SSE: No sessionId found for anonymous user");
      }
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
          console.log("SSE event received:", data);

          // Handle different event types
          if (data.type === "CONNECTION_ACK") {
            // Connection confirmed by server
            console.log("SSE connection acknowledged");
          } else if (data.type === EVENT_TYPES.MODULE_CREATED) {
            // Module created event
            console.log("SSE: Module created event received, data:", data);
            fetchModules().then((data) => {
              if (data.modules) {
                console.log("SSE: Updating modules list with:", data.modules);
                setModules(data.modules);
              }
            });
          } else if (data.type === EVENT_TYPES.MODULE_UPDATED) {
            // Module updated event
            console.log("SSE: Module updated event received, data:", data);
            // Only refresh modules if this is not part of a data migration
            if (!data.isDataMigration) {
              fetchModules().then((data) => {
                if (data.modules) {
                  console.log("SSE: Updating modules list with:", data.modules);
                  setModules(data.modules);
                }
              });
            }
          } else if (data.type === EVENT_TYPES.MODULE_DELETED) {
            // Remove the deleted module from the list
            console.log("SSE: Module deleted event received, data:", data);
            setModules((prevModules) =>
              prevModules.filter((module) => module.id !== data.data.id)
            );
          } else if (data.type === EVENT_TYPES.CHAT_DELETED) {
            // Handle chat deletion event
            const chatData = data.data;
            console.log("Chat deleted event received:", chatData);

            if (chatData && chatData.id) {
              // Remove the deleted chat from the list
              setChats((prevChats) =>
                prevChats.filter((chat) => chat.id !== chatData.id)
              );
            } else {
              console.error("Invalid chat deletion data in event:", data);
            }
          } else if (data.type === "HEARTBEAT") {
            // Server heartbeat received
          } else if (data.type === "chat.created") {
            // Handle chat creation - redirect to the chat page
            const chatData = data.data;
            console.log("Chat created event received:", chatData);

            if (chatData && chatData.id) {
              console.log("Chat created event received with ID:", chatData.id);

              // Directly update state with the new chat data instead of refreshing
              setChats((prevChats) => {
                // Check if we already have this chat in our list to prevent duplicates
                const chatExists = prevChats.some(
                  (chat) => chat.id === chatData.id
                );
                if (chatExists) {
                  return prevChats;
                }
                // Add the new chat at the top of the list
                return [chatData, ...prevChats];
              });

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

            if (
              messageData &&
              messageData.chatId &&
              messageData.chatTitle &&
              messageData.updatedAt
            ) {
              console.log("Message created for chat ID:", messageData.chatId);

              // Directly update the specific chat in the list
              setChats((prevChats) => {
                // Find the chat to update
                const chatIndex = prevChats.findIndex(
                  (chat) => chat.id === messageData.chatId
                );

                // If chat doesn't exist, return unchanged state
                if (chatIndex === -1) {
                  console.log(`Chat ${messageData.chatId} not found in list`);
                  return prevChats;
                }

                // Extract the chat to update
                const chatToUpdate = prevChats[chatIndex];

                // Create updated chat with new title and timestamp
                const updatedChat = {
                  ...chatToUpdate,
                  title: messageData.chatTitle,
                  updatedAt: messageData.updatedAt,
                };

                // Create a new array with the chat moved to the top
                const newChats = [
                  updatedChat,
                  ...prevChats.slice(0, chatIndex),
                  ...prevChats.slice(chatIndex + 1),
                ];

                return newChats;
              });
            } else {
              console.error(
                "Invalid or incomplete message data in event:",
                data
              );
              // Fall back to refresh if data is incomplete
              refreshChatHistory();
            }
          } else if (
            data.type === EVENT_TYPES.DATA_MIGRATED ||
            data.type === "data.migrated"
          ) {
            // Data migration event occurred, refresh both modules and chats
            console.log("SSE: Data migration event received, refreshing data");

            // Refresh modules
            fetchModules().then((data) => {
              if (data.modules) {
                console.log(
                  `SSE: Updated modules list with ${data.modules.length} modules after migration`
                );
                setModules(data.modules);
              }
            });

            // Refresh chat history
            refreshChatHistory();
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
          let pingUrl = "/api/events/ping";
          if (!userId) {
            const sessionId = localStorage.getItem("anonymous_session_id");
            if (sessionId) {
              pingUrl += `?sessionId=${sessionId}`;
            }
          }
          fetch(pingUrl).catch(() => {
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
  }, [isLoaded, userId, pathname, router, fetchModules, refreshChatHistory]);

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
  }, [isLoaded, fetchModules, refreshChatHistory]);

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

  // Now let's add the optimistic UI update functionality
  // This function will be used to add a new chat to the list immediately when user creates one
  const addOptimisticChat = useCallback(
    (chatTitle: string, moduleId: string | null = null) => {
      const optimisticChat: Chat = {
        id: `optimistic-${Date.now()}`, // Temporary ID until real one arrives
        title: chatTitle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        moduleId: moduleId,
        module: moduleId
          ? {
              id: moduleId,
              name: modules.find((m) => m.id === moduleId)?.name || "Module",
              icon: modules.find((m) => m.id === moduleId)?.icon || "📚",
            }
          : null,
        _isOptimistic: true, // Mark as optimistic to replace when real data arrives
      };

      setChats((prevChats) => [optimisticChat, ...prevChats]);

      return optimisticChat.id;
    },
    [modules]
  );

  // Export the function via a ref so parent components can access it
  const addOptimisticChatRef = useRef(addOptimisticChat);
  useEffect(() => {
    addOptimisticChatRef.current = addOptimisticChat;

    // Make the function globally available for other components
    if (typeof window !== "undefined") {
      // Use a properly typed window extension
      const win = window as unknown as {
        __sidebarChatUpdater?: (
          title: string,
          moduleId: string | null
        ) => string;
      };
      win.__sidebarChatUpdater = addOptimisticChat;
    }

    // Cleanup when component unmounts
    return () => {
      if (typeof window !== "undefined") {
        const win = window as unknown as {
          __sidebarChatUpdater?: (
            title: string,
            moduleId: string | null
          ) => string;
        };
        delete win.__sidebarChatUpdater;
      }
    };
  }, [addOptimisticChat]);

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
            <ChatHistory chats={chats} loading={loadingChats} />
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
