"use client";

import React, {
  useEffect,
  useState,
  useRef,
  Suspense,
  useCallback,
} from "react";
import { useAuth } from "@clerk/nextjs";
import { Chat } from "./ChatHistory";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarRail,
} from "@/components/Sidebar/SidebarParts";
import { useSidebar } from "@/context/sidebar-context";
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
import { getOrCreateSessionIdClient } from "@/lib/session";
import { getOSModifierKey, SHORTCUTS } from "@/lib/utils";

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

/**
 * Renders the sidebar for the Study Chat application.
 *
 * This component displays the module list and chat history while managing real-time updates
 * through server-sent events. It fetches modules and chats based on the current authentication state,
 * handles optimistic UI updates for new chats, and navigates to appropriate pages upon module or chat interactions.
 *
 * @param searchParams - The URL search parameters used to determine the current module context.
 */
function ClientSidebarContent({
  searchParams,
}: {
  searchParams: URLSearchParams;
}) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { state, isMobile } = useSidebar();
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

  // Fetch chat history function - refreshes the chat list
  const refreshChatHistory = useCallback(async () => {
    try {
      console.log("Refreshing chat history...");

      // Use the API client
      if (!isLoaded) {
        console.log("Skipping chat history fetch - auth not loaded yet");
        return;
      }
      try {
        setLoadingChats(true);
        console.log("Fetching chats...");

        // Use the API client instead of direct fetch
        const data = await api.getChatHistory();

        // Log the raw data response
        console.log("Raw chat data response:", JSON.stringify(data));

        // Check the structure and handle it appropriately
        if (Array.isArray(data)) {
          console.log(`Retrieved ${data.length} chats (array format)`);
          setChats(data);
        } else if (data && Array.isArray(data.chats)) {
          console.log(
            `Retrieved ${data.chats.length} chats (object.chats format)`
          );
          setChats(data.chats);
        } else {
          console.log("Retrieved 0 chats", data);
          setChats([]);
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
        setChats([]);
      } finally {
        setLoadingChats(false);
      }
    } catch (error) {
      console.error("Error refreshing chat history:", error);
    }
  }, [isLoaded]);

  // Set up Server-Sent Events (SSE) for real-time updates
  useEffect(() => {
    if (!isLoaded) return;

    let url = `/api/events`;

    // Add either userId for authenticated users or get sessionId for anonymous users
    if (userId) {
      url += `?userId=${userId}`;
    } else {
      // For anonymous users, get the session ID from localStorage
      const sessionId = getOrCreateSessionIdClient();
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
                // Check if there's an optimistic chat to update
                const optimisticChatIndex = prevChats.findIndex(
                  (chat) => chat._isOptimistic === true
                );

                // If we found an optimistic chat, replace it with the real one
                if (optimisticChatIndex !== -1) {
                  console.log(
                    `Replacing optimistic chat with real ID: ${messageData.chatId}`
                  );

                  // Get the optimistic chat to preserve any needed data
                  const optimisticChat = prevChats[optimisticChatIndex];

                  // Create updated chat with real ID and data
                  const updatedChat = {
                    ...optimisticChat,
                    id: messageData.chatId,
                    title: messageData.chatTitle,
                    updatedAt: messageData.updatedAt,
                    _isOptimistic: false, // No longer optimistic
                  };

                  // Create a new array with the updated chat moved to the top
                  return [
                    updatedChat,
                    ...prevChats.slice(0, optimisticChatIndex),
                    ...prevChats.slice(optimisticChatIndex + 1),
                  ];
                }

                // Find the chat to update by its real ID
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
            const sessionId = getOrCreateSessionIdClient();
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

  // Listen for custom chat deletion events
  useEffect(() => {
    const handleChatDeleted = (event: CustomEvent<{ chatId: string }>) => {
      const { chatId } = event.detail;
      console.log(`Custom chat-deleted event received for chat: ${chatId}`);

      // Update the chat list by filtering out the deleted chat
      setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
    };

    // Add event listener
    window.addEventListener("chat-deleted", handleChatDeleted as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener(
        "chat-deleted",
        handleChatDeleted as EventListener
      );
    };
  }, []);

  // Create a welcome chat for anonymous users
  const createWelcomeChatForAnonymousUsers = useCallback(async () => {
    try {
      const sessionId = getOrCreateSessionIdClient();
      if (!sessionId) return;

      console.log(
        "Creating welcome chat for anonymous user with sessionId:",
        sessionId
      );

      // Call the welcome chat API
      const response = await fetch(`/api/chat/welcome?sessionId=${sessionId}`, {
        method: "POST",
      });

      if (response.ok) {
        // Refresh chat history to show the welcome chat
        refreshChatHistory();
      }
    } catch (error) {
      console.error("Error creating welcome chat:", error);
    }
  }, [refreshChatHistory]);

  // Initial data fetching
  useEffect(() => {
    // Load modules and chat history on mount
    if (isLoaded) {
      setLoading(true);

      // Fetch modules data
      fetchModules()
        .then((data) => {
          if (data.modules) {
            setModules(data.modules);
          }
        })
        .catch((error) => {
          console.error("Error fetching modules:", error);
          setError("Failed to load modules. Please try again later.");
        })
        .finally(() => {
          setLoading(false);
        });

      // Use shorter timeout for signed-in users, longer for anonymous
      const timeoutMs = isSignedIn ? 100 : 300;

      // Fetch chat history with a small delay to ensure auth is settled
      setTimeout(() => {
        refreshChatHistory().then(() => {
          // For anonymous users, ensure they have a welcome chat
          if (!isSignedIn) {
            createWelcomeChatForAnonymousUsers();
          }
        });
      }, timeoutMs);
    }
  }, [
    isLoaded,
    fetchModules,
    refreshChatHistory,
    isSignedIn,
    createWelcomeChatForAnonymousUsers,
  ]);

  // Get header height for positioning expand button
  const headerRef = useRef<HTMLDivElement>(null);
  const [, setHeaderHeight] = useState(0);
  const [modifierKey, setModifierKey] = useState("⌘");

  // Measure header height on mount and resize
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight / 2);
    }

    // Set the modifier key based on OS
    setModifierKey(getOSModifierKey());

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
    (
      chatTitle: string,
      moduleId: string | null = null,
      forceOldest = false
    ) => {
      const optimisticChat: Chat = {
        id: `optimistic-${Date.now()}`, // Temporary ID until real one arrives
        title: chatTitle,
        createdAt: forceOldest
          ? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() // One year ago for oldest chats
          : new Date().toISOString(),
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

      setChats((prevChats) => {
        if (forceOldest) {
          // Add to the end of the list for oldest chats
          return [...prevChats, optimisticChat];
        } else {
          // Add to the beginning for newest chats
          return [optimisticChat, ...prevChats];
        }
      });

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
          moduleId: string | null,
          forceOldest?: boolean
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
            moduleId: string | null,
            forceOldest?: boolean
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
          className="flex items-center relative z-50 justify-between"
        >
          {/* Always render the Link, control visibility with CSS */}
          <Link
            href="/chat"
            className={cn(
              "text-xl font-bold",
              state === "expanded" || isMobile ? "block" : "hidden"
            )}
          >
            Study Chat
          </Link>
          <div
            className={cn(
              "flex items-center gap-1",
              state === "collapsed" &&
                !isMobile &&
                "fixed left-[0.75rem] top-3 bg-[hsl(var(--sidebar-background))] rounded-md"
            )}
          >
            <SidebarTrigger />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/chat")}
              title={`New chat (${modifierKey}+${SHORTCUTS.NEW_CHAT})`}
              className={cn(
                "h-9 w-9",
                state === "collapsed" &&
                  !isMobile &&
                  "bg-[hsl(var(--sidebar-background))]"
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
        <div
          className={
            state === "expanded" || isMobile ? "h-1/3 min-h-[150px]" : ""
          }
        >
          <ModuleList
            modules={modules}
            loading={loading}
            currentModule={currentModule || activeModuleId}
            handleModuleClick={handleModuleClick}
            collapsed={state === "collapsed" && !isMobile}
            router={{ push: router.push, refresh: router.refresh }}
            pathname={pathname}
          />
        </div>

        {/* Chat History Section - always visible on mobile */}
        {(state === "expanded" || isMobile) && (
          <div className="h-2/3 min-h-[200px]">
            <ChatHistory chats={chats} loading={loadingChats} />
          </div>
        )}
      </SidebarContent>

      {(state === "expanded" || isMobile) && (
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
