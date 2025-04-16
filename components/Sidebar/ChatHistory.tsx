"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { MessageSquare, X, ExternalLink, Plus, Trash } from "lucide-react";
import { cn, encodeModuleSlug } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useNavigation } from "./SidebarParts";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

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
  chats?: Chat[];
  loading?: boolean;
  maxWidth?: string;
}

export default function ChatHistory({
  chats = [],
  loading = false,
  maxWidth,
}: ChatHistoryProps) {
  const pathname = usePathname();
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const { navigate } = useNavigation();

  // Function to group chats by time periods
  const groupChatsByDate = (chats: Chat[]) => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0); // Start of today

    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    const oneMonthAgo = new Date(now);
    oneMonthAgo.setDate(now.getDate() - 30);

    const todayChats: Chat[] = [];
    const last7Days: Chat[] = [];
    const last30Days: Chat[] = [];
    const older: Chat[] = [];

    chats.forEach((chat) => {
      // Always put optimistic chats in Today section
      if (chat._isOptimistic) {
        todayChats.push(chat);
        return;
      }

      const chatDate = new Date(chat.updatedAt);

      if (chatDate >= today) {
        todayChats.push(chat);
      } else if (chatDate >= oneWeekAgo) {
        last7Days.push(chat);
      } else if (chatDate >= oneMonthAgo) {
        last30Days.push(chat);
      } else {
        older.push(chat);
      }
    });

    return {
      today: todayChats,
      last7Days,
      last30Days,
      older,
    };
  };

  const isActiveChat = (chat: Chat) => {
    // Special case for welcome chat
    if (chat.title === "Welcome to Study Chat") {
      return pathname === "/chat/welcome";
    }

    // Special case for optimistic chats / new chats
    if (chat._isOptimistic) {
      // If we're on a path that ends with just /chat or /moduleName/chat
      const isModulePath = pathname.indexOf("/chat") > 1; // Like /moduleName/chat
      const isRootPath = pathname === "/chat";

      if (chat.moduleId) {
        // Module-specific new chat
        return isModulePath && !pathname.includes("/chat/");
      } else {
        // Regular new chat
        return isRootPath;
      }
    }

    if (pathname === `/chat/${chat.id}`) {
      return true;
    }

    if (chat.moduleId && chat.module) {
      const encodedName = encodeModuleSlug(chat.module.name);
      return pathname === `/${encodedName}/chat/${chat.id}`;
    }

    return false;
  };

  const navigateToChat = (chat: Chat) => {
    // Modified navigation for welcome chat - always route to /chat/welcome
    if (chat.title === "Welcome to Study Chat") {
      navigate("/chat/welcome");
    } else if (chat.moduleId && chat.module) {
      const encodedName = encodeModuleSlug(chat.module.name);
      navigate(`/${encodedName}/chat/${chat.id}`);
    } else {
      navigate(`/chat/${chat.id}`);
    }
  };

  const handleDeleteChat = async (chat: Chat) => {
    try {
      // Add your delete API call here
      const response = await fetch(`/api/chat/${chat.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      toast.success("Chat deleted successfully");

      // Dispatch event to update UI
      window.dispatchEvent(
        new CustomEvent("chat-deleted", {
          detail: { chatId: chat.id },
        })
      );
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    }
  };

  const groupedChats = groupChatsByDate(chats);

  const renderChatGroup = (chats: Chat[], title: string) => {
    if (chats.length === 0) return null;

    return (
      <div className="mb-3">
        <h3 className="text-xs text-muted-foreground font-medium px-4 mb-1 pb-1 border-b border-border/40">
          {title}
        </h3>
        {chats.map((chat) => (
          <ContextMenu key={chat.id}>
            <ContextMenuTrigger className="w-full">
              <div className="group/chat relative px-2">
                <div
                  className={cn(
                    "w-full text-left py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground flex items-center justify-between",
                    isActiveChat(chat)
                      ? "bg-accent text-accent-foreground font-regular border-r-4 border-primary shadow-sm"
                      : ""
                  )}
                  style={{ maxWidth: maxWidth }}
                >
                  <button
                    type="button"
                    className="flex-1 flex items-center gap-2 truncate pl-2"
                    onClick={() => navigateToChat(chat)}
                  >
                    {chat.module ? (
                      <span className="flex-shrink-0">{chat.module.icon}</span>
                    ) : (
                      <MessageSquare size={14} className="flex-shrink-0" />
                    )}
                    <span className="truncate">{chat.title}</span>
                  </button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover/chat:opacity-100 hover:text-white hover:bg-red-600 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setChatToDelete(chat);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Module tooltip on hover */}
                {chat.module && (
                  <div className="absolute mr-1 left-0 right-12 top-0 bottom-0 flex items-center opacity-0 group-hover/chat:opacity-100 pointer-events-none">
                    <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md shadow-md ml-auto transform translate-x-4 hidden group-hover/chat:block">
                      <span className="flex items-center gap-1">
                        <span className="truncate">{chat.module.name}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem
                onClick={() => {
                  const url = chat.moduleId
                    ? `/${encodeModuleSlug(chat.module?.name || "")}/chat/${
                        chat.id
                      }`
                    : `/chat/${chat.id}`;
                  window.open(url, "_blank");
                }}
                className="cursor-pointer text-xs"
              >
                <ExternalLink className="mr-2 h-4 w-4" /> Open in new tab
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => setChatToDelete(chat)}
                className="cursor-pointer text-destructive focus:text-destructive text-xs"
              >
                <Trash className="mr-2 h-4 w-4" /> Delete chat
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 h-8">
        <h2 className="text-xs font-semibold">Chat History</h2>
      </div>
      <ScrollArea className="h-full pb-8">
        <div className="py-1">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-r-transparent" />
            </div>
          ) : (
            <div className="space-y-4">
              {renderChatGroup(groupedChats.today, "Today")}
              {renderChatGroup(groupedChats.last7Days, "Last 7 Days")}
              {renderChatGroup(groupedChats.last30Days, "Last 30 Days")}
              {renderChatGroup(groupedChats.older, "Older")}

              {!loading && chats.length === 0 && (
                <div className="px-4 py-3 text-center">
                  <p className="text-sm text-muted-foreground">No chats yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!chatToDelete}
        onOpenChange={(open) => {
          if (!open) setChatToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                if (chatToDelete) {
                  handleDeleteChat(chatToDelete);
                }
                setChatToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
