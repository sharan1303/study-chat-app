"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { cn, encodeModuleSlug } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  moduleId: string | null;
  module?: {
    name: string;
    icon: string;
  } | null;
}

export default function ChatHistory({
  chats,
  loading,
}: {
  chats: Chat[];
  loading: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

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
      <div className="flex items-center px-4 pt-4 pb-2 border-t">
        <h3 className="text-sm font-medium">Chat History</h3>
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
