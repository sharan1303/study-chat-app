"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X } from "lucide-react";
import { cn, encodeModuleSlug } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getOrCreateSessionIdClient } from "@/lib/session";
import { useNavigation } from "./SidebarParts";

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
  _isOptimistic?: boolean; // Optional flag for optimistic UI updates
}

export default function ChatHistory({
  chats,
  loading,
  maxWidth,
}: {
  chats: Chat[];
  loading: boolean;
  maxWidth?: string;
}) {
  const pathname = usePathname();
  const [chatToDelete, setChatToDelete] = React.useState<Chat | null>(null);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const { navigate } = useNavigation();

  // Load sessionId from localStorage on component mount (client-side only)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSessionId = getOrCreateSessionIdClient();
      if (storedSessionId) {
        setSessionId(storedSessionId);
      }
    }
  }, []);

  const isActiveChat = (chat: Chat) => {
    // Special case for welcome chat - only check the welcome path
    if (chat.title === "Welcome to Study Chat") {
      return pathname === "/chat/welcome";
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
      // Build URL with sessionId for anonymous users
      let url = `/api/chat/${chat.id}`;
      if (sessionId) {
        url += `?sessionId=${sessionId}`;
      }

      const response = await fetch(url, {
        method: "DELETE",
        credentials: "include", // This ensures cookies are sent with the request
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error deleting chat: ${errorText}`);
        throw new Error(`Failed to delete chat: ${errorText}`);
      }

      toast.success("Chat deleted successfully");

      // Remove deleted chat from UI immediately
      window.dispatchEvent(
        new CustomEvent("chat-deleted", {
          detail: { chatId: chat.id },
        })
      );

      // If we're on the deleted chat's page, redirect to /chat
      if (isActiveChat(chat)) {
        navigate("/chat");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-4 pt-4 pb-2 border-t">
        <h3 className="text-sm font-medium">Chat History</h3>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <ScrollArea className="h-full">
            <div className="space-y-1 p-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-2 py-3 group/chat">
                  <div className="flex items-center">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
                      <Skeleton className="h-4 w-[180px] rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : chats.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground"></div>
        ) : (
          <ScrollArea className="h-full max-w-full">
            <div className="space-y-1 p-2">
              {chats
                .filter(
                  (chat, index, self) =>
                    // Filter out duplicate welcome chats
                    chat.title !== "Welcome to Study Chat" ||
                    index ===
                      self.findIndex((c) => c.title === "Welcome to Study Chat")
                )
                .map((chat) => (
                  <div
                    key={chat.id}
                    className="group/chat"
                    style={{ maxWidth: maxWidth }}
                  >
                    <div
                      className={cn(
                        "w-full text-left px-2 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground flex items-center justify-between",
                        isActiveChat(chat)
                          ? "bg-accent text-accent-foreground font-regular border-r-4 border-primary shadow-sm"
                          : ""
                      )}
                    >
                      <button
                        type="button"
                        className="flex-1 flex items-center justify-between truncate"
                        onClick={() => {
                          navigateToChat(chat);
                        }}
                      >
                        <div className="flex items-center truncate group-hover/chat:max-w-[calc(100%-70px)]">
                          <MessageSquare
                            size={14}
                            className="mr-2 mt-0.5 flex-shrink-0"
                          />
                          <span className="truncate">{chat.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground hidden group-hover/chat:inline whitespace-nowrap pr-1">
                          {formatDate(chat.updatedAt)}
                        </span>
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1 opacity-0 group-hover/chat:opacity-100 hover:bg-red-500 hover:text-white transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setChatToDelete(chat);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Thread</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{chat.title}
                              &quot;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => {
                                if (chatToDelete) {
                                  handleDeleteChat(chatToDelete);
                                }
                              }}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
