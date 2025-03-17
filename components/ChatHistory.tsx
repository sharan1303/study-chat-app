"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { cn, encodeModuleSlug } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      <div className="flex items-center px-4 pt-4 border-t">
        <h3 className="text-sm font-medium">Chat History</h3>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="px-4 py-2 text-sm text-muted-foreground">
            Loading...
          </div>
        ) : chats.length === 0 ? (
          <div className="px-4 py-2 text-sm text-muted-foreground">
            No chat history
          </div>
        ) : (
          <ScrollArea className="h-full pr-1">
            <div className="space-y-1 p-2">
              {chats.map((chat) => (
                <div key={chat.id} className="group/chat">
                  <button
                    className={cn(
                      "w-full text-left px-2 py-2 text-sm rounded-md hover:bg-muted flex items-center justify-between",
                      isActiveChat(chat) ? "bg-muted font-medium" : ""
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
                    <div className="flex items-center truncate">
                      <MessageSquare size={14} className="mr-2 flex-shrink-0" />
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
