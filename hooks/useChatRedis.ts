import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  getChatHistory,
  createChat,
  sendMessage,
  getSpecificChat,
  deleteChat,
} from "@/app/actions/chat";
import { useAuth } from "@clerk/nextjs";
import { getOrCreateSessionId } from "@/lib/anonymousSession";
import { encodeModuleSlug } from "@/lib/utils";

// Match existing Chat interface from ChatHistory component
export interface Chat {
  id: string;
  title: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  moduleId: string | null;
  module?: {
    name: string;
    icon: string;
    id: string;
  } | null;
  _isOptimistic?: boolean;
  _currentPath?: string; // Store the current path for active state
}

export interface PaginationInfo {
  hasMore: boolean;
  nextCursor: string | null;
}

/**
 * A hook that provides chat functionality using Redis and Server Actions
 * Designed to be a drop-in replacement for existing SSE-based chat functionality
 */
export default function useChatRedis() {
  const { userId, isSignedIn } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    hasMore: false,
    nextCursor: null,
  });

  const router = useRouter();
  const pathname = usePathname();

  // Set up session ID for anonymous users
  useEffect(() => {
    if (!isSignedIn) {
      try {
        // Import dynamically to avoid SSR issues
        const getSession = async () => {
          const { getOrCreateSessionId } = await import(
            "@/lib/anonymousSession"
          );
          const sid = getOrCreateSessionId();
          console.log("Redis hook using session ID:", sid);
          setSessionId(sid);
        };

        getSession();
      } catch (error) {
        console.error("Error setting up session ID:", error);
      }
    }
  }, [isSignedIn]);

  // Fetch chat history
  const fetchChats = useCallback(async (limit?: number, cursor?: string) => {
    setIsLoading(true);

    try {
      const result = await getChatHistory(limit || 20, cursor);

      // Transform dates to make compatible with existing interfaces
      const transformedChats = result.chats.map((chat) => ({
        ...chat,
        createdAt:
          chat.createdAt instanceof Date
            ? chat.createdAt.toISOString()
            : chat.createdAt,
        updatedAt:
          chat.updatedAt instanceof Date
            ? chat.updatedAt.toISOString()
            : chat.updatedAt,
      }));

      // If loading with a cursor, append to existing chats
      if (cursor) {
        setChats((prev) => [...prev, ...transformedChats]);
      } else {
        setChats(transformedChats);
      }

      setPagination(result.pagination);
      return result;
    } catch (err) {
      setError("Failed to load chat history");
      console.error("Error fetching chats:", err);
      return { chats: [], pagination: { hasMore: false, nextCursor: null } };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new chat
  const startNewChat = useCallback(
    async (params: {
      title?: string;
      moduleId?: string | null;
      sessionId?: string | null;
      messages?: any[];
      module?: {
        id: string;
        name: string;
        icon: string;
      } | null;
    }) => {
      try {
        // If no messages are provided, this is a new empty chat
        // We should just navigate to /chat or the module chat route without creating a chat yet
        if (!params.messages || params.messages.length === 0) {
          // Just navigate to the appropriate chat page without creating a chat yet
          if (params.moduleId) {
            // For module chats, we need to find out the module name
            // This would typically come from params.module
            if (params.module && params.module.name) {
              const encodedName = encodeModuleSlug(params.module.name);
              router.push(`/${encodedName}/chat`);
            } else {
              // Fall back to generic route if we don't have module info
              router.push("/chat");
            }
          } else {
            // For regular chats
            router.push("/chat");
          }
          return null;
        }

        // For non-empty chats (welcome chats, etc.), create them normally
        // If we have messages, proceed with creating a real chat (for example, welcome chats)
        const optimisticId = `temp-${Date.now()}`;
        const currentPath = pathname;

        // Create an optimistic chat object
        const optimisticChat: Chat = {
          id: optimisticId,
          title: params.title || "New Chat",
          moduleId: params.moduleId || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _isOptimistic: true,
          _currentPath: currentPath,
        };

        // Add module information if moduleId is provided
        if (params.moduleId && params.module) {
          optimisticChat.module = {
            id: params.moduleId,
            name: params.module.name || "Loading...",
            icon: params.module.icon || "🔄",
          };
        }

        // Add optimistic chat to state
        setChats((prev) => [optimisticChat, ...prev]);
        console.log("Added optimistic chat:", optimisticId);

        // Create the actual chat with the effective session ID
        const effectiveSessionId = !isSignedIn ? sessionId : undefined;
        console.log("Creating chat with sessionId:", effectiveSessionId);

        const newChat = await createChat({
          title: params.title || "New Chat",
          moduleId: params.moduleId || null,
          sessionId: effectiveSessionId,
          messages: params.messages || [],
          optimisticChatId: optimisticId,
        });

        console.log("Created new chat:", newChat?.id);

        if (!newChat) {
          throw new Error("Failed to create chat");
        }

        // Replace optimistic chat with real one
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === optimisticId
              ? {
                  ...newChat,
                  createdAt:
                    newChat.createdAt instanceof Date
                      ? newChat.createdAt.toISOString()
                      : newChat.createdAt,
                  updatedAt:
                    newChat.updatedAt instanceof Date
                      ? newChat.updatedAt.toISOString()
                      : newChat.updatedAt,
                }
              : chat
          )
        );

        // Navigate to the new chat with the actual chat ID
        if (newChat.moduleId && newChat.module) {
          const encodedName = encodeModuleSlug(newChat.module.name);
          router.push(`/${encodedName}/chat/${newChat.id}`);
        } else {
          router.push(`/chat/${newChat.id}`);
        }

        return newChat;
      } catch (err) {
        setError("Failed to create new chat");
        console.error("Error creating chat:", err);

        // Remove optimistic chat on error
        setChats((prev) => prev.filter((chat) => !chat._isOptimistic));
        return null;
      }
    },
    [router, pathname, isSignedIn, sessionId]
  );

  // Get a specific chat
  const getChat = useCallback(async (chatId: string) => {
    if (!chatId) return null;

    try {
      const chat = await getSpecificChat(chatId);

      // Transform dates to make compatible with existing interfaces
      if (chat) {
        return {
          ...chat,
          createdAt:
            chat.createdAt instanceof Date
              ? chat.createdAt.toISOString()
              : chat.createdAt,
          updatedAt:
            chat.updatedAt instanceof Date
              ? chat.updatedAt.toISOString()
              : chat.updatedAt,
        };
      }

      return null;
    } catch (err) {
      console.error(`Error fetching chat ${chatId}:`, err);
      return null;
    }
  }, []);

  // Delete a chat
  const removeChat = useCallback(async (chatId: string) => {
    try {
      await deleteChat(chatId);

      // Update local state
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));

      // Dispatch event to maintain compatibility with existing code
      window.dispatchEvent(
        new CustomEvent("chat-deleted", {
          detail: { chatId },
        })
      );

      return true;
    } catch (err) {
      console.error(`Error deleting chat ${chatId}:`, err);
      return false;
    }
  }, []);

  // Load more chats (for pagination)
  const loadMore = useCallback(
    async (cursor: string) => {
      if (!pagination.hasMore || !pagination.nextCursor) return;

      return await fetchChats(20, cursor);
    },
    [fetchChats, pagination.hasMore, pagination.nextCursor]
  );

  // Initial load of chats
  useEffect(() => {
    if (isSignedIn !== undefined) {
      fetchChats();
    }
  }, [fetchChats, isSignedIn]);

  return {
    chats,
    isLoading,
    error,
    pagination,
    fetchChats,
    loadMore,
    startNewChat,
    getChat,
    removeChat,
  };
}
