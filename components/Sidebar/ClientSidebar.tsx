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
import { Separator } from "@radix-ui/react-separator";

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
      return [];
    }
  }, []);

  // Function to fetch a single chat with complete module information
  const fetchSingleChat = useCallback(
    async (chatId: string) => {
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

        // Ensure module information is complete
        if (
          chat &&
          chat.moduleId &&
          (!chat.module || !chat.module.name || !chat.module.icon)
        ) {
          const moduleInfo = modules.find((m) => m.id === chat.moduleId);
          if (moduleInfo) {
            chat.module = {
              id: moduleInfo.id,
              name: moduleInfo?.name ?? "Module",
              icon: moduleInfo?.icon ?? "📚",
            };
          }
        }

        return chat;
      } catch (error) {
        return null;
      }
    },
    [modules]
  );

  // Fetch chat history function - refreshes the chat list
  const refreshChatHistory = useCallback(async () => {
    setLoadingChats(true);
    try {
      const chats = await fetchChats();
      setChats(chats);
    } catch (error) {
    } finally {
      setLoadingChats(false);
    }
  }, [fetchChats]);

  // Set up Server-Sent Events (SSE) for real-time updates
  useEffect(() => {
    if (!isLoaded) return;

    // Check if EventSource is supported in this browser
    if (typeof EventSource === "undefined") {
      // EventSource is not supported in this browser
      // Consider implementing a fallback mechanism like polling
      return;
    }

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
        // No sessionId found for anonymous user
      }
    }

    let es: EventSource | null = null;

    // Create a new EventSource if it doesn't exist, or reuse existing one
    if (eventSourceRef.current) {
      es = eventSourceRef.current;
    } else if (typeof window !== "undefined") {
      try {
        // Use a try-catch block for EventSource creation
        const newEs = new EventSource(url, { withCredentials: true });
        es = newEs;
        eventSourceRef.current = newEs;

        // Add a delay before setting up event handlers to ensure connection is properly established
        setTimeout(() => {
          // Event handlers will be set up below
        }, 100);
      } catch (error) {
        // Try to reconnect after delay
        setTimeout(() => {
          try {
            const retryEs = new EventSource(url, { withCredentials: true });
            eventSourceRef.current = retryEs;
          } catch (retryError) {
            // Retry failed
          }
        }, 3000);
      }
    }

    if (es) {
      // Set up error handler
      es.onerror = (err) => {
        // EventSource error

        // Check the readyState and connection state
        const connectionState = es
          ? es.readyState === 0
            ? "CONNECTING"
            : es.readyState === 1
            ? "OPEN"
            : es.readyState === 2
            ? "CLOSED"
            : "UNKNOWN"
          : "NULL";

        // Add a more robust error handling and reconnection strategy
        if (!es || es.readyState === EventSource.CLOSED) {
          // EventSource connection closed or in error state, attempting to reconnect

          // Close the existing connection if it exists
          if (es) {
            es.close();
            eventSourceRef.current = null;
          }

          // Try to reconnect after a delay with exponential backoff
          setTimeout(() => {
            if (typeof window !== "undefined") {
              try {
                const newEs = new EventSource(url);
                eventSourceRef.current = newEs;

                // Set up same handlers on the new connection
                newEs.onopen = () => {
                  // Reconnected EventSource opened successfully
                };
                newEs.onerror = es.onerror; // Reuse same error handler

                // Re-attach the message handler
                newEs.onmessage = es.onmessage;
              } catch (reconnectError) {
                // Failed to reconnect EventSource
              }
            }
          }, 3000);
        }
      };

      // Add open handler to confirm connection
      es.onopen = () => {
        // EventSource connection opened successfully
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
              // Invalid chat deletion data in event
            }
          } else if (data.type === "HEARTBEAT") {
            // Server heartbeat received
          } else if (isEventType(EVENT_TYPES.CHAT_CREATED, "chat.created")) {
            // We got a real chat - might be replacing an optimistic one
            const newChat = data.data;

            // First check if this is replacing an optimistic chat
            setChats((prevChats) => {
              // Make sure newChat exists before attempting to access properties
              if (!newChat) {
                // Received chat.created event with undefined chat data
                return prevChats;
              }

              // First check if this chat already exists in our list
              const existingChatIndex = prevChats.findIndex(
                (chat) => chat.id === newChat.id
              );

              if (existingChatIndex >= 0) {
                return prevChats;
              }

              // Check if we have an optimistic chat ID to match against
              if (newChat.optimisticChatId) {
                // Try to find the optimistic chat with matching ID
                const optimisticIdIndex = prevChats.findIndex(
                  (chat) => chat.id === newChat.optimisticChatId
                );

                if (optimisticIdIndex >= 0) {
                  // Replace the optimistic chat with the real one but preserve UI state
                  const updatedChats = [...prevChats];
                  const existingChat = prevChats[optimisticIdIndex];

                  // Ensure module info is preserved if it exists in the optimistic chat
                  // but missing in the server response
                  const moduleInfo =
                    newChat.module || (newChat.moduleId && existingChat.module)
                      ? {
                          id: newChat.moduleId || existingChat.moduleId,
                          name:
                            (newChat.module && newChat.module.name) ??
                            (existingChat.module && existingChat.module.name) ??
                            modules.find(
                              (m) =>
                                m.id ===
                                (newChat.moduleId || existingChat.moduleId)
                            )?.name ??
                            "Module",
                          icon:
                            (newChat.module && newChat.module.icon) ??
                            (existingChat.module && existingChat.module.icon) ??
                            modules.find(
                              (m) =>
                                m.id ===
                                (newChat.moduleId || existingChat.moduleId)
                            )?.icon ??
                            "📚",
                        }
                      : null;

                  // Preserve UI state attributes
                  updatedChats[optimisticIdIndex] = {
                    ...existingChat,
                    id: newChat.id,
                    title: newChat.title,
                    createdAt: newChat.createdAt,
                    updatedAt: newChat.updatedAt,
                    moduleId: newChat.moduleId,
                    module: moduleInfo,
                    _isOptimistic: false,
                    _currentPath: existingChat._currentPath,
                  };
                  return updatedChats;
                }
              }

              // If no optimistic chat ID match, look for a generic optimistic chat
              const optimisticIndex = prevChats.findIndex(
                (chat) =>
                  chat._isOptimistic &&
                  (chat.moduleId === (newChat?.moduleId || null) ||
                    (!chat.moduleId && !newChat?.moduleId))
              );

              if (optimisticIndex >= 0) {
                // Replace the optimistic chat with the real one but preserve UI state
                const updatedChats = [...prevChats];
                const existingChat = prevChats[optimisticIndex];

                // Ensure module info is preserved if it exists in the optimistic chat
                // but missing in the server response
                const moduleInfo =
                  newChat.module || (newChat.moduleId && existingChat.module)
                    ? {
                        id: newChat.moduleId || existingChat.moduleId,
                        name:
                          (newChat.module && newChat.module.name) ??
                          (existingChat.module && existingChat.module.name) ??
                          modules.find(
                            (m) =>
                              m.id ===
                              (newChat.moduleId || existingChat.moduleId)
                          )?.name ??
                          "Module",
                        icon:
                          (newChat.module && newChat.module.icon) ??
                          (existingChat.module && existingChat.module.icon) ??
                          modules.find(
                            (m) =>
                              m.id ===
                              (newChat.moduleId || existingChat.moduleId)
                          )?.icon ??
                          "📚",
                      }
                    : null;

                // Log module information for debugging
                console.log(
                  "CHAT_CREATED replacing optimistic chat - moduleInfo:",
                  moduleInfo
                );

                // Preserve UI state attributes
                updatedChats[optimisticIndex] = {
                  ...existingChat,
                  id: newChat.id,
                  title: newChat.title,
                  createdAt: newChat.createdAt,
                  updatedAt: newChat.updatedAt,
                  moduleId: newChat.moduleId,
                  module: moduleInfo,
                  _isOptimistic: false,
                  _currentPath: existingChat._currentPath,
                };
                return updatedChats;
              } else {
                // If the new chat has a moduleId but no module info, try to add it
                if (newChat.moduleId && !newChat.module) {
                  const moduleInfo = modules.find(
                    (m) => m.id === newChat.moduleId
                  );
                  if (moduleInfo) {
                    console.log(
                      "Adding module info to chat:",
                      moduleInfo?.name
                    );
                    newChat.module = {
                      id: moduleInfo.id,
                      name: moduleInfo?.name ?? "Module",
                      icon: moduleInfo?.icon ?? "📚",
                    };
                  }
                }
                // Just add as a new chat
                return [newChat, ...prevChats];
              }
            });
          } else if (
            isEventType(EVENT_TYPES.MESSAGE_CREATED, "message.created")
          ) {
            // Handle new message creation event - this is where we update chat titles
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
                  // Check for "New Chat" that needs title update first
                  const newChatIndex = prevChats.findIndex(
                    (chat) =>
                      (chat.title === "New Chat" || chat._isOptimistic) &&
                      chat.id === messageData.chatId
                  );

                  if (newChatIndex >= 0) {
                    // Update the New Chat title with first message
                    const updatedChats = [...prevChats];
                    updatedChats[newChatIndex] = {
                      ...updatedChats[newChatIndex],
                      title: messageData.chatTitle,
                      updatedAt: messageData.updatedAt,
                      _isOptimistic: false,
                    };
                    return [
                      updatedChats[newChatIndex],
                      ...updatedChats.slice(0, newChatIndex),
                      ...updatedChats.slice(newChatIndex + 1),
                    ];
                  }

                  // Regular chat update logic continues...
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
                    updatedAt: messageData.updatedAt,
                    moduleId: messageData.moduleId,
                    // Do NOT update title for existing chats
                  };

                  // If missing module info, add it from modules list if possible
                  if (!updatedChat.module && messageData.moduleId) {
                    const moduleInfo = modules.find(
                      (m) => m.id === messageData.moduleId
                    );

                    if (moduleInfo) {
                      updatedChat.module = {
                        id: moduleInfo.id,
                        name: moduleInfo?.name ?? "Module",
                        icon: moduleInfo?.icon ?? "📚",
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
                  // Check for "New Chat" that needs title update first
                  const newChatIndex = prevChats.findIndex(
                    (chat) =>
                      (chat.title === "New Chat" || chat._isOptimistic) &&
                      chat.id === messageData.chatId
                  );

                  if (newChatIndex >= 0) {
                    // Update the New Chat title with first message
                    const updatedChats = [...prevChats];
                    updatedChats[newChatIndex] = {
                      ...updatedChats[newChatIndex],
                      title: messageData.chatTitle,
                      updatedAt: messageData.updatedAt,
                      _isOptimistic: false,
                    };
                    return [
                      updatedChats[newChatIndex],
                      ...updatedChats.slice(0, newChatIndex),
                      ...updatedChats.slice(newChatIndex + 1),
                    ];
                  }

                  // Check if there's an optimistic chat to update (any optimistic chat, not just "New Chat")
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
                      createdAt:
                        prevChats[optimisticChatIndex].createdAt ||
                        new Date().toISOString(),
                      moduleId: messageData.moduleId,
                      module: messageData.module || null,
                      _isOptimistic: false,
                      _currentPath: prevChats[optimisticChatIndex]._currentPath,
                    } as Chat;

                    // Create a new array with the updated chat moved to the top
                    return [
                      updatedChat,
                      ...prevChats.slice(0, optimisticChatIndex),
                      ...prevChats.slice(optimisticChatIndex + 1),
                    ];
                  }

                  // For existing chats, ONLY update position and timestamp - NOT title
                  const chatIndex = prevChats.findIndex(
                    (chat) => chat.id === messageData.chatId
                  );

                  if (chatIndex === -1) {
                    return prevChats;
                  }

                  // Extract and update the chat
                  const chatToUpdate = prevChats[chatIndex];

                  // Create updated chat with new timestamp only
                  const updatedChat = {
                    ...chatToUpdate,
                    updatedAt: messageData.updatedAt,
                    // Do NOT update title for existing chats that aren't optimistic
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
              // Invalid or incomplete message data in event
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
              // Check specifically for "New Chat" that needs to be updated
              setChats((prevChats) => {
                // Look for "New Chat" entries first, regardless of optimisticChatId
                const newChatIndex = prevChats.findIndex(
                  (chat) =>
                    (chat.title === "New Chat" ||
                      chat._isOptimistic === true) &&
                    (chat.id === messageData.chatId ||
                      chat.id === messageData.optimisticChatId ||
                      (!messageData.optimisticChatId &&
                        chat._isOptimistic === true))
                );

                if (newChatIndex >= 0) {
                  // Preserve module info if it exists in the optimistic chat
                  const existingChat = prevChats[newChatIndex];
                  const moduleInfo =
                    messageData.module ||
                    (messageData.moduleId && existingChat.module)
                      ? {
                          id: messageData.moduleId || existingChat.moduleId,
                          name:
                            (messageData.module && messageData.module.name) ??
                            (existingChat.module && existingChat.module.name) ??
                            modules.find(
                              (m) =>
                                m.id ===
                                (messageData.moduleId || existingChat.moduleId)
                            )?.name ??
                            "Module",
                          icon:
                            (messageData.module && messageData.module.icon) ??
                            (existingChat.module && existingChat.module.icon) ??
                            modules.find(
                              (m) =>
                                m.id ===
                                (messageData.moduleId || existingChat.moduleId)
                            )?.icon ??
                            "📚",
                        }
                      : null;

                  // Replace the "New Chat" with the actual message title
                  const updatedChats = [...prevChats];
                  updatedChats[newChatIndex] = {
                    ...updatedChats[newChatIndex],
                    id: messageData.chatId, // Ensure ID is set correctly
                    title: messageData.chatTitle,
                    updatedAt: messageData.updatedAt,
                    moduleId: messageData.moduleId || existingChat.moduleId,
                    module: moduleInfo,
                    _isOptimistic: false,
                    _currentPath: existingChat._currentPath,
                  };

                  // Move to top of list
                  return [
                    updatedChats[newChatIndex],
                    ...updatedChats.slice(0, newChatIndex),
                    ...updatedChats.slice(newChatIndex + 1),
                  ];
                }

                // For existing chats, ONLY update position, timestamp - NEVER create optimistic entries
                if (messageData.chatId) {
                  const chatIndex = prevChats.findIndex(
                    (chat) =>
                      chat.id === messageData.chatId && !chat._isOptimistic
                  );

                  if (chatIndex !== -1) {
                    // Just update the existing chat's timestamp to move it to the top
                    // but PRESERVE the original title - only update timestamp
                    const updatedChat = {
                      ...prevChats[chatIndex],
                      updatedAt: messageData.updatedAt,
                      // Do NOT update title for existing chats with non-first messages
                    };

                    // Move to top of list without creating an optimistic entry
                    return [
                      updatedChat,
                      ...prevChats.slice(0, chatIndex),
                      ...prevChats.slice(chatIndex + 1),
                    ];
                  }
                }

                // Continue with the existing logic for other cases
                if (messageData.optimisticChatId) {
                  // Find the optimistic chat by its ID
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
                      _currentPath: prevChats[optimisticChatIndex]._currentPath,
                    } as Chat;

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
                  } as Chat;

                  return [newChat, ...prevChats];
                } else if (messageData.moduleId) {
                  // For module chats, ensure we have complete module info
                  // First check if there's any optimistic chat to replace
                  const optimisticChatIndex = prevChats.findIndex(
                    (chat) => chat._isOptimistic === true
                  );

                  if (optimisticChatIndex !== -1) {
                    // Find module information
                    const moduleInfo = modules.find(
                      (m) => m.id === messageData.moduleId
                    );

                    // Create module object with complete info
                    const moduleObject = moduleInfo
                      ? {
                          id: messageData.moduleId,
                          name: moduleInfo.name ?? "Module",
                          icon: moduleInfo.icon ?? "📚",
                        }
                      : null;

                    console.log(
                      "Module chat update - Module info:",
                      moduleObject
                    );

                    // Replace the optimistic chat with the real one
                    const updatedChat = {
                      id: messageData.chatId,
                      title: messageData.chatTitle,
                      updatedAt: messageData.updatedAt,
                      createdAt:
                        prevChats[optimisticChatIndex].createdAt ||
                        new Date().toISOString(),
                      moduleId: messageData.moduleId,
                      module: moduleObject,
                      _isOptimistic: false,
                      _currentPath: prevChats[optimisticChatIndex]._currentPath,
                    } as Chat;

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
                    // If chat not found, add a new entry with module info
                    const moduleInfo = modules.find(
                      (m) => m.id === messageData.moduleId
                    );

                    // Create module object with complete info
                    const moduleObject = moduleInfo
                      ? {
                          id: messageData.moduleId,
                          name: moduleInfo.name ?? "Module",
                          icon: moduleInfo.icon ?? "📚",
                        }
                      : null;

                    console.log("New module chat - Module info:", moduleObject);

                    const newChat = {
                      id: messageData.chatId,
                      title: messageData.chatTitle,
                      updatedAt: messageData.updatedAt,
                      createdAt: new Date().toISOString(),
                      moduleId: messageData.moduleId,
                      module: moduleObject,
                      _isOptimistic: false,
                    } as Chat;

                    return [newChat, ...prevChats];
                  }

                  // Otherwise update the existing chat with module info
                  const chatToUpdate = prevChats[chatIndex];
                  const moduleInfo = modules.find(
                    (m) => m.id === messageData.moduleId
                  );

                  // Create module object with complete info
                  const moduleObject = moduleInfo
                    ? {
                        id: messageData.moduleId,
                        name: moduleInfo.name ?? "Module",
                        icon: moduleInfo.icon ?? "📚",
                      }
                    : chatToUpdate.module;

                  console.log(
                    "Updating existing module chat - Module info:",
                    moduleObject
                  );

                  const updatedChat = {
                    ...chatToUpdate,
                    title: messageData.chatTitle,
                    updatedAt: messageData.updatedAt,
                    moduleId: messageData.moduleId,
                    module: moduleObject,
                  };

                  return [
                    updatedChat,
                    ...prevChats.slice(0, chatIndex),
                    ...prevChats.slice(chatIndex + 1),
                  ];
                } else {
                  // For regular chats just updating title, find the chat
                  const chatIndex = prevChats.findIndex(
                    (chat) => chat.id === messageData.chatId
                  );

                  if (chatIndex !== -1) {
                    // Update title and move to top
                    const updatedChat = {
                      ...prevChats[chatIndex],
                      title: messageData.chatTitle,
                      updatedAt: messageData.updatedAt,
                    };

                    return [
                      updatedChat,
                      ...prevChats.slice(0, chatIndex),
                      ...prevChats.slice(chatIndex + 1),
                    ];
                  }

                  // If chat not found, create a new one
                  const newChat = {
                    id: messageData.chatId,
                    title: messageData.chatTitle,
                    updatedAt: messageData.updatedAt,
                    createdAt: new Date().toISOString(),
                    moduleId: null,
                    module: null,
                  } as Chat;

                  return [newChat, ...prevChats];
                }
              });
            } else {
              // Invalid or incomplete user message data in event
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
          } else {
            pingUrl += `?userId=${userId}`;
          }

          fetch(pingUrl, {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }).catch((pingError) => {
            // If ping fails, close and reconnect
            if (es) {
              es.close();
              eventSourceRef.current = null;
            }
          });
        } catch (error) {
          // Error during keepalive ping
        }
      } else if (es && es.readyState === EventSource.CLOSED) {
        // Attempt reconnection
        try {
          es.close();
          eventSourceRef.current = null;
          const newEs = new EventSource(url, { withCredentials: true });
          eventSourceRef.current = newEs;
        } catch (reconnectError) {
          // Failed to reconnect during keepalive check
        }
      }
    }, 30000);

    // Clean up on unmount or when dependencies change
    return () => {
      clearInterval(keepaliveTimer);

      // Always close the EventSource connection on cleanup
      if (eventSourceRef.current) {
        try {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        } catch (error) {
          // Error closing EventSource during cleanup
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
    } catch (error) {}
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
      // Navigate to module details page with module name in URL
      router.push(`/modules/${encodeModuleSlug(moduleName)}`);
    }
  };

  // Modified to handle creating a new chat properly with sidebar highlighting
  const handleNewChat = () => {
    // Check if we're already on a new chat page to prevent duplicates
    if (pathname === "/chat" || pathname.endsWith("/chat")) {
      // If we're already on a chat page, just refresh the router
      router.refresh();
      return;
    }

    // Regular chat context - always go to main chat, not module-specific
    router.push("/chat");

    // We're removing the optimistic chat creation here
    // The chat will be added to history only after first message is sent
  };

  // Now let's add the optimistic UI update functionality
  // This function will be used to add a new chat to the list immediately when user creates one
  const addOptimisticChat = useCallback(
    (
      chatTitle: string,
      moduleId: string | null = null,
      forceOldest = false,
      currentPath = ""
    ) => {
      // Get today's date - we want all new chats to appear in today's section
      const now = new Date();
      const todayDate = now.toISOString();

      // Find module info in our modules list
      const moduleInfo = moduleId
        ? modules.find((m) => m.id === moduleId)
        : null;

      // Log what we found for debugging
      console.log("Creating optimistic chat with moduleId:", moduleId);
      console.log("Found module info:", moduleInfo);

      const optimisticChat: Chat = {
        id: `optimistic-${Date.now()}`, // Temporary ID until real one arrives
        title: chatTitle,
        createdAt: forceOldest
          ? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() // One year ago for oldest chats
          : todayDate,
        updatedAt: todayDate, // Always use today's date for sorting
        moduleId: moduleId,
        module:
          moduleId && moduleInfo
            ? {
                id: moduleId,
                name: moduleInfo?.name ?? "Module",
                icon: moduleInfo?.icon ?? "📚",
              }
            : null,
        _isOptimistic: true, // Mark as optimistic to replace when real data arrives
        _currentPath: currentPath, // Store the current path for active state
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
      // Before setting a new updater, check if we already have optimistic chats
      const win = window as unknown as {
        __sidebarChatUpdater?: (
          title: string,
          moduleId: string | null,
          forceOldest?: boolean,
          currentPath?: string
        ) => string;
        __hasPendingOptimisticChat?: boolean;
      };

      // Add a method to check if we already have an optimistic chat
      win.__hasPendingOptimisticChat = chats.some(
        (chat) => chat._isOptimistic === true
      );

      // Only update the function if it doesn't exist already
      win.__sidebarChatUpdater = (
        title,
        moduleId,
        forceOldest = false,
        currentPath = ""
      ) => {
        // We should ONLY add optimistic chats for brand new chats
        // or when forceOldest is true (for welcome/initial chats)
        const effectiveModuleId = moduleId;

        // Skip adding optimistic chats for paths that aren't new chat paths
        // unless forceOldest is true (for welcome chats)
        const isNewChatPath =
          currentPath === "/chat" ||
          (currentPath.endsWith("/chat") && !currentPath.includes("/chat/"));

        if (!isNewChatPath && !forceOldest) {
          // Return empty string to signal that we're not creating an optimistic chat
          // for existing chat paths
          return "";
        }

        // Check if we already have an optimistic chat that matches this context
        const hasMatchingOptimisticChat = chats.some(
          (chat) =>
            chat._isOptimistic === true &&
            (chat.moduleId === effectiveModuleId ||
              (!chat.moduleId && !effectiveModuleId))
        );

        // Don't create a duplicate if we already have a matching optimistic chat
        // or if this is not a new chat path (unless forceOldest is true)
        if (hasMatchingOptimisticChat && !forceOldest) {
          // Return the ID of the first matching optimistic chat
          const existingChat = chats.find(
            (chat) =>
              chat._isOptimistic === true &&
              (chat.moduleId === effectiveModuleId ||
                (!chat.moduleId && !effectiveModuleId))
          );
          return existingChat?.id || "";
        }

        // Otherwise create a new one with the effective moduleId
        return addOptimisticChat(
          title,
          effectiveModuleId,
          forceOldest,
          currentPath
        );
      };
    }

    // Cleanup when component unmounts
    return () => {
      if (typeof window !== "undefined") {
        const win = window as unknown as {
          __sidebarChatUpdater?: (
            title: string,
            moduleId: string | null,
            forceOldest?: boolean,
            currentPath?: string
          ) => string;
          __hasPendingOptimisticChat?: boolean;
        };
        win.__sidebarChatUpdater = undefined;
        win.__hasPendingOptimisticChat = undefined;
      }
    };
  }, [addOptimisticChat, chats]);

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
              onClick={handleNewChat}
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
          <div className="px-4 py-2 mt-2 text-sm text-red-600 bg-red-50 rounded mx-2">
            <p className="font-semibold">Error loading modules:</p>
            <p className="text-xs break-words">{error}</p>
          </div>
        )}

        {/* Module List */}
        <div
          className={
            state === "expanded" || isMobile ? "h-1/4 min-h-[240px]" : ""
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

        <Separator className="border-t" />

        {/* Chat History Section - always visible on mobile */}
        {(state === "expanded" || isMobile) && (
          <div className="h-3/4">
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
