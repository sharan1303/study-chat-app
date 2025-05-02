import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getChatHistory,
  createChat,
  sendMessage,
  getSpecificChat,
  deleteChat,
} from "@/app/actions/chat";

export interface Chat {
  id: string;
  title: string;
  moduleId: string | null;
  userId: string | null;
  sessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  module?: {
    id: string;
    name: string;
    icon: string;
  } | null;
  messages?: Message[];
}

export interface Message {
  id: string;
  role: string;
  content: string;
  chatId: string;
  createdAt: Date;
}

export interface Pagination {
  hasMore: boolean;
  nextCursor: string | null;
}

export default function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    hasMore: false,
    nextCursor: null,
  });
  const router = useRouter();

  // Fetch chat history
  const fetchChats = useCallback(async (limit?: number, cursor?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getChatHistory(limit, cursor);

      // If loading with a cursor, append to existing chats
      if (cursor && result.chats) {
        setChats((prev) => [...prev, ...result.chats]);
      } else if (result.chats) {
        setChats(result.chats);
      }

      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (err) {
      setError("Failed to load chat history");
      console.error("Error fetching chats:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load more chats
  const loadMore = useCallback(async () => {
    if (pagination.hasMore && pagination.nextCursor) {
      await fetchChats(20, pagination.nextCursor);
    }
  }, [fetchChats, pagination.hasMore, pagination.nextCursor]);

  // Create a new chat
  const startNewChat = useCallback(
    async (params: {
      title?: string;
      moduleId?: string | null;
      sessionId?: string | null;
      messages?: any[];
    }) => {
      setIsLoading(true);

      try {
        const newChat = await createChat({
          title: params.title || "New Chat",
          moduleId: params.moduleId || null,
          sessionId: params.sessionId || null,
          messages: params.messages || [],
        });

        // Update local state
        setChats((prev) => [newChat, ...prev]);

        // Navigate to the new chat
        router.push(`/chat/${newChat.id}`);

        return newChat;
      } catch (err) {
        setError("Failed to create new chat");
        console.error("Error creating chat:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // Get a specific chat with messages
  const getChat = useCallback(async (chatId: string) => {
    if (!chatId) return null;

    try {
      return await getSpecificChat(chatId);
    } catch (err) {
      console.error(`Error fetching chat ${chatId}:`, err);
      return null;
    }
  }, []);

  // Send a message to a chat
  const addMessage = useCallback(
    async (params: {
      chatId: string;
      content: string | any[];
      role: "user" | "assistant" | "system";
      moduleId?: string | null;
    }) => {
      try {
        return await sendMessage(params);
      } catch (err) {
        console.error("Error sending message:", err);
        return null;
      }
    },
    []
  );

  // Delete a chat
  const removeChat = useCallback(async (chatId: string) => {
    try {
      await deleteChat(chatId);

      // Update local state
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));

      return true;
    } catch (err) {
      console.error(`Error deleting chat ${chatId}:`, err);
      return false;
    }
  }, []);

  // Initial load of chats
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return {
    chats,
    isLoading,
    error,
    pagination,
    fetchChats,
    loadMore,
    startNewChat,
    getChat,
    addMessage,
    removeChat,
  };
}
