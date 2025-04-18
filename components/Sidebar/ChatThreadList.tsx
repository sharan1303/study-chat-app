"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useNavigation } from "./SidebarParts";
import { useSidebar } from "@/context/sidebar-context";
import { ChatContextMenu } from "./ChatContextMenu";

export interface ChatThread {
  id: string;
  title: string;
  lastMessage?: string | null;
  updatedAt?: string | null;
  path: string;
  isNewChat?: boolean;
}

interface ChatThreadListProps {
  threads: ChatThread[];
  loading: boolean;
  isActive?: (path: string) => boolean;
  handleChatClick?: (chatId: string, path: string) => void;
  pathname?: string | null | undefined;
  router?: { push: (url: string) => void; refresh: () => void };
  collapsed?: boolean;
  maxWidth?: string;
  onDelete?: (chatId: string) => void;
  showNewChatButton?: boolean;
  onNewChatClick?: () => void;
}

/**
 * Renders a list of chat thread items with navigation and menu capabilities.
 */
export default function ChatThreadList({
  threads = [],
  loading = false,
  isActive,
  handleChatClick,
  pathname: pathnameFromProps,
  router: routerFromProps,
  collapsed = false,
  maxWidth,
  onDelete,
  showNewChatButton = false,
  onNewChatClick,
}: ChatThreadListProps) {
  const nextRouter = useRouter();
  const nextPathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { navigate } = useNavigation();

  const router = React.useMemo(
    () =>
      routerFromProps || {
        push: (url: string) => {
          if (isMobile) {
            setOpenMobile(false);
          }
          nextRouter.push(url);
        },
        refresh: () => nextRouter.refresh(),
      },
    [routerFromProps, nextRouter, isMobile, setOpenMobile]
  );

  const pathname = pathnameFromProps || nextPathname;

  const checkIsActive = isActive || ((path: string) => pathname === path);

  const onThreadClick = (chatId: string, path: string) => {
    if (handleChatClick) {
      handleChatClick(chatId, path);
      if (isMobile) {
        setOpenMobile(false);
      }
    } else {
      navigate(path);
    }
  };

  const handleDeleteThread = (chatId: string) => {
    if (onDelete) {
      onDelete(chatId);
    }
    router.refresh();
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className={collapsed ? "p-1" : "p-2 pt-0"}>
          {loading ? (
            <div className="text-center py-5">
              {!collapsed && (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-r-transparent mx-auto mb-2" />
                </>
              )}
            </div>
          ) : (
            <nav className="grid gap-1 ml-2">

              {threads.map((thread) => (
                <ChatContextMenu
                  key={thread.id}
                  chatId={thread.id}
                  chatName={thread.title}
                  chatPath={thread.path}
                  onDelete={() => handleDeleteThread(thread.id)}
                  disabled={thread.isNewChat}
                >
                  <div className="w-full relative cursor-context-menu">
                    <button
                      type="button"
                      onClick={(e) => {
                        onThreadClick(thread.id, thread.path);
                      }}
                      style={{ maxWidth: maxWidth }}
                      className={cn(
                        "w-full text-left px-2 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground flex items-center gap-2 group",
                        checkIsActive(thread.path) || thread.isNewChat
                          ? "bg-accent text-accent-foreground font-regular border-r-4 border-primary shadow-sm"
                          : "",
                        collapsed && "justify-center"
                      )}
                    >
                      <span>
                        <MessageSquare className="h-4 w-4" />
                      </span>
                      {!collapsed && (
                        <span className="truncate flex-1">{thread.title}</span>
                      )}
                    </button>
                  </div>
                </ChatContextMenu>
              ))}
            </nav>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
