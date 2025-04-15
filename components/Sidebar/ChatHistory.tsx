"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChatThread } from "./ChatThreadList";
import ChatThreadList from "./ChatThreadList";
import axios from "axios";
import { toast } from "sonner";

// Add the Chat interface export to resolve the import error
export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  moduleId: string | null;
  module?: {
    name: string;
    icon: string;
    id: string;
  } | null;
  _isOptimistic?: boolean;
}

interface ChatHistoryProps {
  collapsed?: boolean;
  chats?: any[]; // Accept existing chats data from the server
  loading?: boolean; // Accept loading state from parent
  maxWidth?: string; // Add maxWidth prop to match ClientSidebar usage
}

export default function ChatHistory({
  collapsed = false,
  chats: initialChats,
  loading: initialLoading = true,
  maxWidth,
}: ChatHistoryProps) {
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(initialLoading);
  const pathname = usePathname();

  // Transform raw chats data into ChatThread format
  useEffect(() => {
    if (initialChats && Array.isArray(initialChats)) {
      const threads = initialChats.map((chat) => ({
        id: chat.id,
        title: chat.title || "Untitled Chat",
        lastMessage: chat.lastMessage,
        updatedAt: chat.updatedAt || chat.createdAt,
        path: `/chat/${chat.id}`,
      }));
      setChatThreads(threads);
      setLoading(false);
    } else if (!initialChats) {
      // Only fetch if no initial data was provided
      fetchChats();
    }
  }, [initialChats]);

  // Load chat threads
  const fetchChats = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint for fetching chat threads
      const response = await axios.get("/api/chats");

      // Transform the data to match the ChatThread interface
      const threads = response.data.map((chat: any) => ({
        id: chat.id,
        title: chat.title || "Untitled Chat",
        lastMessage: chat.lastMessage,
        updatedAt: chat.updatedAt || chat.createdAt,
        path: `/chat/${chat.id}`,
      }));

      setChatThreads(threads);
    } catch (error) {
      console.error("Failed to load chat threads:", error);
      toast.error("Failed to load chat history");
    } finally {
      setLoading(false);
    }
  };

  // Listen for chat updates
  useEffect(() => {
    const handleChatUpdate = () => {
      fetchChats();
    };

    window.addEventListener("chat.updated", handleChatUpdate);
    window.addEventListener("chat.created", handleChatUpdate);
    window.addEventListener("chat.deleted", handleChatUpdate);

    return () => {
      window.removeEventListener("chat.updated", handleChatUpdate);
      window.removeEventListener("chat.created", handleChatUpdate);
      window.removeEventListener("chat.deleted", handleChatUpdate);
    };
  }, []);

  // Handle chat deletion
  const handleDeleteChat = async (chatId: string) => {
    try {
      // Replace with your actual API endpoint for deleting a chat
      await axios.delete(`/api/chats/${chatId}`);

      // Update local state by filtering out the deleted chat
      setChatThreads((prevThreads) =>
        prevThreads.filter((thread) => thread.id !== chatId)
      );

      // Dispatch an event to notify other components
      window.dispatchEvent(
        new CustomEvent("chat.deleted", {
          detail: { chatId },
        })
      );
    } catch (error) {
      console.error("Failed to delete chat:", error);
      toast.error("Failed to delete chat");
    }
  };

  return (
    <ChatThreadList
      threads={chatThreads}
      loading={loading}
      pathname={pathname}
      collapsed={collapsed}
      onDelete={handleDeleteChat}
      maxWidth={maxWidth}
    />
  );
}
