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
  context?: string | null;
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
      const data = await api.getModules();
      return data;
    } catch (error) {
      console.error("Error fetching modules:", error);
      return { modules: [] };
    }
  }, [isLoaded]);

  // Fetch chats function
  const fetchChats = useCallback(async () => {
    try {
      const data = await api.getChatHistory();
      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.chats)) {
        return data.chats;
      }
      return [];
    } catch (error) {
      console.error("Error fetching chats:", error);
      return [];
    }
  }, []);

  // Function to fetch a single chat with complete module information
  const fetchSingleChat = useCallback(async (chatId: string) => {
    if (!chatId) return null;

    try {
      const sessionId = getOrCreateSessionIdClient();
      const searchParams = new URLSearchParams();
      if (sessionId) {
        searchParams.append("sessionId", sessionId);
      }

      const response = await fetch(
        `/api/chat/${chatId}?${searchParams.toString()}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch chat: ${response.statusText}`);
      }

      const chat = await response.json();
      return chat;
    } catch (error) {
      console.error(`Error fetching single chat ${chatId}:`, error);
      return null;
    }
  }, []);

  // Fetch chat history function - refreshes the chat list
  const refreshChatHistory = useCallback(async () => {
    setLoadingChats(true);
    try {
      const chats = await fetchChats();
      setChats(chats);
    } catch (error) {
      console.error("Error refreshing chat history:", error);
    } finally {
      setLoadingChats(false);
    }
  }, [fetchChats]);

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
      es.onerror = (err) => {
        console.error("EventSource error:", err);
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

      // Add open handler to confirm connection
      es.onopen = () => {
        console.log("EventSource connection opened successfully");
      };

      // Set up message handler for general messages
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Helper function to check event type against both string literals and constants
          const isEventType = (type: string, constant: string) =>
            data.type === type || data.type === constant;

          // Handle different event types
          if (data.type === "CONNECTION_ACK") {
            // Connection confirmed by server
          } else if (
            isEventType(EVENT_TYPES.MODULE_CREATED, "module.created")
          ) {
            // Module created event
            fetchModules().then((data) => {
              if (data.modules) {
                setModules(data.modules);
              }
            });
          } else if (
            isEventType(EVENT_TYPES.MODULE_UPDATED, "module.updated")
          ) {
            // Module updated event
            // Only refresh modules if this is not part of a data migration
            if (!data.isDataMigration) {
              fetchModules().then((data) => {
                if (data.modules) {
                  setModules(data.modules);
                }
              });
            }
          } else if (
            isEventType(EVENT_TYPES.MODULE_DELETED, "module.deleted")
          ) {
            // Remove the deleted module from the list
            setModules((prevModules) =>
              prevModules.filter((module) => module.id !== data.data.id)
            );
          } else if (isEventType(EVENT_TYPES.CHAT_DELETED, "chat.deleted")) {
            // Handle chat deletion event
            const chatData = data.data;

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
          } else if (isEventType(EVENT_TYPES.CHAT_CREATED, "chat.created")) {
            // Handle chat creation - redirect to the chat page
            const chatData = data.data;

            if (chatData && chatData.id) {
              // Directly update state with the new chat data instead of refreshing
              setChats((prevChats) => {
                // First check if this is replacing an optimistic chat
                if (chatData.optimisticChatId) {
                  const optimisticChatIndex = prevChats.findIndex(
                    (chat) => chat.id === chatData.optimisticChatId
                  );

                  if (optimisticChatIndex !== -1) {
                    // Replace the optimistic chat with the real one
                    const updatedChat = {
                      id: chatData.id,
                      title: chatData.title,
                      createdAt: chatData.createdAt,
                      updatedAt: new Date().toISOString(),
                      moduleId: chatData.moduleId,
                      module: chatData.module || null,
                      _isOptimistic: false,
                    };

                    // Create a new array with the real chat replacing the optimistic one
                    return [
                      updatedChat,
                      ...prevChats.slice(0, optimisticChatIndex),
                      ...prevChats.slice(optimisticChatIndex + 1),
                    ];
                  }
                }

                // If no optimistic chat to replace, continue with normal flow
                // Check if we already have this chat in our list to prevent duplicates
                const chatExists = prevChats.some(
                  (chat) => chat.id === chatData.id
                );
                if (chatExists) {
                  return prevChats;
                }

                // Process module information for the chat
                const chatToAdd = { ...chatData };

                // If module info is missing but we have moduleId, try to add it from modules list
                if (chatData.moduleId && !chatData.module) {
                  const moduleInfo = modules.find(
                    (m) => m.id === chatData.moduleId
                  );
                  if (moduleInfo) {
                    chatToAdd.module = {
                      id: moduleInfo.id,
                      name: moduleInfo.name,
                      icon: moduleInfo.icon,
                    };
                  } else {
                    // Fetch complete chat info asynchronously
                    fetchSingleChat(chatData.id)
                      .then((completeChat) => {
                        if (completeChat && completeChat.module) {
                          setChats((existingChats) => {
                            const chatIndex = existingChats.findIndex(
                              (chat) => chat.id === chatData.id
                            );
                            if (chatIndex >= 0) {
                              const updatedChats = [...existingChats];
                              updatedChats[chatIndex] = completeChat;
                              return updatedChats;
                            }
                            return existingChats;
                          });
                        }
                      })
                      .catch((err) => {
                        console.error(`Error fetching complete chat: ${err}`);
                      });
                  }
                }

                // Add the new chat at the top of the list
                return [chatToAdd, ...prevChats];
              });

              // Redirect based on whether it's a module chat or regular chat
              if (chatData.moduleId) {
                // For module chats, get the module info
                const moduleInfo = modules.find(
                  (m) => m.id === chatData.moduleId
                );

                if (moduleInfo) {
                  const encodedModuleName = encodeModuleSlug(moduleInfo.name);
                  router.push(`/${encodedModuleName}/chat/${chatData.id}`);
                }
              } else if (pathname === "/chat") {
                // For regular chats, use the standard route
                router.push(`/chat/${chatData.id}`);
              }
            } else {
              console.error("Invalid chat data in event:", data);
            }
          } else if (
            isEventType(EVENT_TYPES.MESSAGE_CREATED, "message.created")
          ) {
            // Handle new message creation event
            const messageData = data.data;

            if (
              messageData &&
              messageData.chatId &&
              messageData.chatTitle &&
              messageData.updatedAt
            ) {
              // For module chats, ensure we have complete module info by fetching the chat
              if (messageData.moduleId) {
                // First update the chat list with what we know
                setChats((prevChats) => {
                  const chatIndex = prevChats.findIndex(
                    (chat) => chat.id === messageData.chatId
                  );

                  if (chatIndex === -1) {
                    return prevChats;
                  }

                  // Extract and update the chat
                  const chatToUpdate = prevChats[chatIndex];
                  const updatedChat = {
                    ...chatToUpdate,
                    title: messageData.chatTitle,
                    updatedAt: messageData.updatedAt,
                    moduleId: messageData.moduleId,
                  };

                  // If missing module info, add it from modules list if possible
                  if (!updatedChat.module && messageData.moduleId) {
                    const moduleInfo = modules.find(
                      (m) => m.id === messageData.moduleId
                    );

                    if (moduleInfo) {
                      updatedChat.module = {
                        id: moduleInfo.id,
                        name: moduleInfo.name,
                        icon: moduleInfo.icon,
                      };
                    }
                  }

                  // Create new array with updated chat at top
                  return [
                    updatedChat,
                    ...prevChats.slice(0, chatIndex),
                    ...prevChats.slice(chatIndex + 1),
                  ];
                });

                // Then fetch complete chat info to ensure we have module data
                fetchSingleChat(messageData.chatId).then((completeChat) => {
                  if (completeChat) {
                    setChats((prevChats) => {
                      // Find the chat in the current list
                      const chatIndex = prevChats.findIndex(
                        (chat) => chat.id === messageData.chatId
                      );

                      // If chat doesn't exist, add it
                      if (chatIndex === -1) {
                        return [completeChat, ...prevChats];
                      }

                      // Replace the existing chat with complete info
                      return [
                        completeChat,
                        ...prevChats.slice(0, chatIndex),
                        ...prevChats.slice(chatIndex + 1),
                      ];
                    });
                  }
                });
              } else {
                // For regular chats, check if we need to update an optimistic chat
                setChats((prevChats) => {
                  // Check if there's an optimistic chat to update
                  const optimisticChatIndex = prevChats.findIndex(
                    (chat) => chat._isOptimistic === true
                  );

                  // If we found an optimistic chat, replace it with the real one
                  if (optimisticChatIndex !== -1) {
                    // Get the optimistic chat to preserve any needed data
                    const optimisticChat = prevChats[optimisticChatIndex];

                    // Create updated chat with real ID and data
                    const updatedChat = {
                      ...optimisticChat,
                      id: messageData.chatId,
                      title: messageData.chatTitle,
                      updatedAt: messageData.updatedAt,
                      moduleId: messageData.moduleId,
                      _isOptimistic: false,
                    };

                    // Create a new array with the updated chat moved to the top
                    return [
                      updatedChat,
                      ...prevChats.slice(0, optimisticChatIndex),
                      ...prevChats.slice(optimisticChatIndex + 1),
                    ];
                  }

                  // Find the chat to update by its ID
                  const chatIndex = prevChats.findIndex(
                    (chat) => chat.id === messageData.chatId
                  );

                  if (chatIndex === -1) {
                    return prevChats;
                  }

                  // Extract and update the chat
                  const chatToUpdate = prevChats[chatIndex];

                  // Create updated chat with new timestamp
                  const updatedChat = {
                    ...chatToUpdate,
                    title: messageData.chatTitle,
                    updatedAt: messageData.updatedAt,
                  };

                  // Create a new array with the chat moved to the top
                  return [
                    updatedChat,
                    ...prevChats.slice(0, chatIndex),
                    ...prevChats.slice(chatIndex + 1),
                  ];
                });
              }
            } else {
              console.error(
                "Invalid or incomplete message data in event:",
                data
              );
              // Fall back to refresh if data is incomplete
              refreshChatHistory();
            }
          } else if (
            isEventType(EVENT_TYPES.USER_MESSAGE_SENT, "user.message.sent")
          ) {
            // Handle user message sent event - similar to MESSAGE_CREATED
            const messageData = data.data;

            if (
              messageData &&
              messageData.chatId &&
              messageData.chatTitle &&
              messageData.updatedAt
            ) {
              // Check if this is replacing an optimistic chat
              if (messageData.optimisticChatId) {
                // Find the optimistic chat by its ID
                setChats((prevChats) => {
                  const optimisticChatIndex = prevChats.findIndex(
                    (chat) => chat.id === messageData.optimisticChatId
                  );

                  // If found, replace the optimistic chat with the real one
                  if (optimisticChatIndex !== -1) {
                    // Create a new chat object with the correct ID and data
                    const updatedChat = {
                      id: messageData.chatId,
                      title: messageData.chatTitle,
                      updatedAt: messageData.updatedAt,
                      createdAt:
                        prevChats[optimisticChatIndex].createdAt ||
                        new Date().toISOString(),
                      moduleId: messageData.moduleId,
                      module: messageData.module || null,
                      _isOptimistic: false,
                    };

                    // Create a new array with the real chat replacing the optimistic one
                    return [
                      updatedChat,
                      ...prevChats.slice(0, optimisticChatIndex),
                      ...prevChats.slice(optimisticChatIndex + 1),
                    ];
                  }

                  // If optimistic chat not found, maybe it was already replaced
                  // Just update the real chat if it exists
                  const chatIndex = prevChats.findIndex(
                    (chat) => chat.id === messageData.chatId
                  );

                  if (chatIndex !== -1) {
                    // Update the existing chat
                    const chatToUpdate = prevChats[chatIndex];
                    const updatedChat = {
                      ...chatToUpdate,
                      title: messageData.chatTitle,
                      updatedAt: messageData.updatedAt,
                      moduleId: messageData.moduleId,
                      module: messageData.module || chatToUpdate.module,
                    };

                    // Move it to the top
                    return [
                      updatedChat,
                      ...prevChats.slice(0, chatIndex),
                      ...prevChats.slice(chatIndex + 1),
                    ];
                  }

                  // If neither chat is found, just add the new chat
                  const newChat = {
                    id: messageData.chatId,
                    title: messageData.chatTitle,
                    updatedAt: messageData.updatedAt,
                    createdAt: new Date().toISOString(),
                    moduleId: messageData.moduleId,
                    module: messageData.module || null,
                  };

                  return [newChat, ...prevChats];
                });
              } else if (messageData.moduleId) {
                // For module chats, ensure we have complete module info
                setChats((prevChats) => {
                  // First check if there's any optimistic chat to replace
                  const optimisticChatIndex = prevChats.findIndex(
                    (chat) => chat._isOptimistic === true
                  );

                  if (optimisticChatIndex !== -1) {
                    // Replace the optimistic chat with the real one
                    const updatedChat = {
                      id: messageData.chatId,
                      title: messageData.chatTitle,
                      updatedAt: messageData.updatedAt,
                      createdAt:
                        prevChats[optimisticChatIndex].createdAt ||
                        new Date().toISOString(),
                      moduleId: messageData.moduleId,
                      module: messageData.module || null,
                      _isOptimistic: false,
                    };

                    return [
                      updatedChat,
                      ...prevChats.slice(0, optimisticChatIndex),
                      ...prevChats.slice(optimisticChatIndex + 1),
                    ];
                  }

                  // Otherwise, update the chat list with what we know
                  const chatIndex = prevChats.findIndex(
                    (chat) => chat.id === messageData.chatId
                  );

                  if (chatIndex === -1) {
                    return prevChats;
                  }

                  // Extract and update the chat
                  const chatToUpdate = prevChats[chatIndex];
                  const updatedChat = {
                    ...chatToUpdate,
                    title: messageData.chatTitle,
                    updatedAt: messageData.updatedAt,
                    moduleId: messageData.moduleId,
                  };

                  // If missing module info, add it from modules list if possible
                  if (!updatedChat.module && messageData.moduleId) {
                    const moduleInfo = modules.find(
                      (m) => m.id === messageData.moduleId
                    );

                    if (moduleInfo) {
                      updatedChat.module = {
                        id: moduleInfo.id,
                        name: moduleInfo.name,
                        icon: moduleInfo.icon,
                      };
                    }
                  }

                  // Create new array with updated chat at top
                  return [
                    updatedChat,
                    ...prevChats.slice(0, chatIndex),
                    ...prevChats.slice(chatIndex + 1),
                  ];
                });
              } else {
                // For regular chats, check if we need to update an optimistic chat
                setChats((prevChats) => {
                  // Check if there's an optimistic chat to update
                  const optimisticChatIndex = prevChats.findIndex(
                    (chat) => chat._isOptimistic === true
                  );

                  // If we found an optimistic chat, replace it with the real one
                  if (optimisticChatIndex !== -1) {
                    // Get the optimistic chat to preserve any needed data
                    const optimisticChat = prevChats[optimisticChatIndex];

                    // Create updated chat with real ID and data
                    const updatedChat = {
                      ...optimisticChat,
                      id: messageData.chatId,
                      title: messageData.chatTitle,
                      updatedAt: messageData.updatedAt,
                      moduleId: messageData.moduleId,
                      _isOptimistic: false,
                    };

                    // Create a new array with the updated chat moved to the top
                    return [
                      updatedChat,
                      ...prevChats.slice(0, optimisticChatIndex),
                      ...prevChats.slice(optimisticChatIndex + 1),
                    ];
                  }

                  // Find the chat to update by its ID
                  const chatIndex = prevChats.findIndex(
                    (chat) => chat.id === messageData.chatId
                  );

                  if (chatIndex === -1) {
                    return prevChats;
                  }

                  // Extract and update the chat
                  const chatToUpdate = prevChats[chatIndex];

                  // Create updated chat with new timestamp
                  const updatedChat = {
                    ...chatToUpdate,
                    title: messageData.chatTitle,
                    updatedAt: messageData.updatedAt,
                  };

                  // Create a new array with the chat moved to the top
                  return [
                    updatedChat,
                    ...prevChats.slice(0, chatIndex),
                    ...prevChats.slice(chatIndex + 1),
                  ];
                });
              }
            } else {
              console.error(
                "Invalid or incomplete user message data in event:",
                data
              );
              refreshChatHistory();
            }
          } else if (isEventType(EVENT_TYPES.DATA_MIGRATED, "data.migrated")) {
            // Data migration event occurred, refresh both modules and chats
            fetchModules().then((data) => {
              if (data.modules) {
                setModules(data.modules);
              }
            });

            // Refresh chat history
            refreshChatHistory();
          } else {
            // Unknown event type
          }
        } catch (error) {
          // Log parsing errors
          console.error("Error parsing SSE event:", error);
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
  }, [
    isLoaded,
    userId,
    pathname,
    router,
    fetchChats,
    fetchSingleChat,
    fetchModules,
    refreshChatHistory,
    modules,
  ]);

  // Listen for custom chat deletion events
  useEffect(() => {
    const handleChatDeleted = (event: CustomEvent<{ chatId: string }>) => {
      const { chatId } = event.detail;
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
        <div className="flex items-center relative z-50 justify-between">
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
            maxWidth={isMobile ? "270px" : "240px"}
          />
        </div>

        {/* Chat History Section - always visible on mobile */}
        {(state === "expanded" || isMobile) && (
          <div className="h-2/3 min-h-[200px]">
            <ChatHistory
              chats={chats}
              loading={loadingChats}
              maxWidth={isMobile ? "270px" : "240px"}
            />
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
