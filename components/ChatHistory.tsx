"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, RefreshCw } from "lucide-react";
import { cn, encodeModuleSlug } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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
}

export default function ChatHistory({
  chats,
  loading,
  onRefresh,
}: {
  chats: Chat[];
  loading: boolean;
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Debug: Log when chat data changes
  React.useEffect(() => {
    console.log("ChatHistory received updated chats:", chats.length);
  }, [chats]);

  const isActiveChat = (chat: Chat) => {
    if (pathname === `/chat/${chat.id}`) {
      return true;
    }

    if (chat.moduleId && chat.module) {
      const encodedName = encodeModuleSlug(chat.module.name);
      return pathname === `/${encodedName}/chat/${chat.id}`;
    }

    return false;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 border-t">
        <h3 className="text-sm font-medium">Chat History</h3>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Refresh chat history"
            onClick={onRefresh}
          >
            <RefreshCw size={14} />
            <span className="sr-only">Refresh</span>
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <ScrollArea className="h-full">
            <div className="space-y-1 p-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-2 py-3 group/chat">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
                      <Skeleton className="h-4 w-[180px] rounded" />
                    </div>
                    <Skeleton className="h-3 w-12 rounded hidden group-hover/chat:inline" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : chats.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground"></div>
        ) : (
          <ScrollArea className="h-full pr-1">
            <div className="space-y-1 p-2">
              {chats.map((chat) => (
                <div key={chat.id} className="group/chat">
                  <button
                    className={cn(
                      "w-full text-left px-2 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground flex items-center justify-between",
                      isActiveChat(chat)
                        ? "bg-accent text-accent-foreground font-medium"
                        : ""
                    )}
                    onClick={() => {
                      if (chat.moduleId && chat.module) {
                        const encodedName = encodeModuleSlug(chat.module.name);
                        router.push(`/${encodedName}/chat/${chat.id}`);
                      } else {
                        router.push(`/chat/${chat.id}`);
                      }
                    }}
                  >
                    <div className="flex items-center truncate group-hover/chat:max-w-[calc(100%-80px)]">
                      <MessageSquare
                        size={14}
                        className="mr-2 mt-0.5 flex-shrink-0"
                      />
                      <span className="truncate">{chat.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground hidden group-hover/chat:inline">
                      {formatDate(chat.updatedAt)}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
