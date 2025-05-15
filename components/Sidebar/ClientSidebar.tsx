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
import { encodeModuleSlug, cn, getOSModifierKey, SHORTCUTS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { EVENT_TYPES } from "@/lib/events";
import { getOrCreateSessionIdClient } from "@/lib/session";
import { Separator } from "@radix-ui/react-separator";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@radix-ui/react-dialog";
import { ModuleForm } from "../dialogs/ModuleForm";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useChatRedis from "@/hooks/useChatRedis";

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

  // State for chat history with pagination
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [chatPagination, setChatPagination] = useState<{
    hasMore: boolean;
    nextCursor: string | null;
  }>({
    hasMore: false,
    nextCursor: null,
  });

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

  // Use Redis-based chat hook
  const {
    chats: redisChats,
    isLoading: loadingRedisChats,
    error: redisChatsError,
    pagination: redisChatsPagination,
    loadMore: loadMoreRedisChats,
    startNewChat: redisStartNewChat,
    removeChat: redisRemoveChat,
  } = useChatRedis();

  // Compatibility function to match existing API pattern
  const fetchChats = useCallback(
    async (cursor?: string) => {
      return {
        chats: redisChats,
        pagination: redisChatsPagination,
      };
    },
    [redisChats, redisChatsPagination]
  );

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

  // Use Redis-based chats directly
  useEffect(() => {
    // Convert the Redis Chat format to the format expected by ChatHistory component
    const convertedChats = redisChats.map((chat) => ({
      ...chat,
      createdAt:
        typeof chat.createdAt === "string"
          ? chat.createdAt
          : chat.createdAt.toISOString(),
      updatedAt:
        typeof chat.updatedAt === "string"
          ? chat.updatedAt
          : chat.updatedAt.toISOString(),
    }));

    // Now set the chats with the correct type
    setChats(convertedChats);
    setChatPagination(redisChatsPagination);
    setLoadingChats(loadingRedisChats);
  }, [redisChats, redisChatsPagination, loadingRedisChats]);

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
  const handleNewChat = useCallback(() => {
    // Check if there's already a New Chat in the sidebar (optimistic chat)
    const hasExistingNewChat = chats.some(
      (chat) => chat._isOptimistic === true || chat.title === "New Chat"
    );

    if (hasExistingNewChat) {
      // If there's already a new chat, just navigate to /chat
      if (activeModuleId) {
        // Find the module for navigation
        const module = modules.find((m) => m.id === activeModuleId);
        if (module) {
          const encodedName = encodeModuleSlug(module.name);
          router.push(`/${encodedName}/chat`);
          return;
        }
      }

      // Navigate to basic chat route
      router.push("/chat");
      return;
    }

    // Otherwise, if no existing new chat, create one
    const params: any = {};

    // If we're in a module context, add the moduleId
    if (activeModuleId) {
      params.moduleId = activeModuleId;

      // Add module info if available
      const module = modules.find((m) => m.id === activeModuleId);
      if (module) {
        params.module = {
          id: module.id,
          name: module.name,
          icon: module.icon,
        };
      }
    }

    redisStartNewChat(params);
  }, [activeModuleId, modules, redisStartNewChat, chats, router]);

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
                id: moduleInfo.id,
                name: moduleInfo.name,
                icon: moduleInfo.icon,
              }
            : null,
        _isOptimistic: true, // Mark as optimistic for later replacement
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
      setChatPagination((prev) => ({
        ...prev,
        hasMore: prev.hasMore || chats.length >= 20,
      }));

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

  // Function to add a new chat or replace an optimistic chat with a real one
  const syncNewChat = useCallback(
    (chat: Chat) => {
      console.log("Syncing new chat:", chat.id, chat.title);
      // Check if this chat already exists (by ID)
      const existingIndex = chats.findIndex((c) => c.id === chat.id);

      if (existingIndex !== -1) {
        // Replace the existing chat
        const updatedChats = [...chats];
        updatedChats[existingIndex] = {
          ...chat,
          createdAt:
            typeof chat.createdAt === "string"
              ? chat.createdAt
              : new Date(chat.createdAt).toISOString(),
          updatedAt:
            typeof chat.updatedAt === "string"
              ? chat.updatedAt
              : new Date(chat.updatedAt).toISOString(),
        };
        setChats(updatedChats);
      } else {
        // Add as a new chat at the beginning of the list
        const newChat = {
          ...chat,
          createdAt:
            typeof chat.createdAt === "string"
              ? chat.createdAt
              : new Date(chat.createdAt).toISOString(),
          updatedAt:
            typeof chat.updatedAt === "string"
              ? chat.updatedAt
              : new Date(chat.updatedAt).toISOString(),
        };
        setChats((prevChats) => [newChat, ...prevChats]);
      }
    },
    [chats]
  );

  // Expose the sync function to the window object for direct access from other components
  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-ignore - Adding properties to window
      window.__syncNewChat = syncNewChat;
    }

    return () => {
      if (typeof window !== "undefined") {
        // @ts-ignore - Cleanup
        delete window.__syncNewChat;
      }
    };
  }, [syncNewChat]);

  // Handle load more chats
  const handleLoadMoreChats = useCallback(
    async (cursor: string) => {
      // Just delegate to the Redis implementation
      return loadMoreRedisChats(cursor);
    },
    [loadMoreRedisChats]
  );

  // Handle delete chat
  const handleDeleteChat = useCallback(
    async (chatId: string) => {
      return redisRemoveChat(chatId);
    },
    [redisRemoveChat]
  );

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
        // Convert the Redis Chat format to the format expected by ChatHistory component
        const convertedChats = redisChats.map((chat) => ({
          ...chat,
          createdAt:
            typeof chat.createdAt === "string"
              ? chat.createdAt
              : chat.createdAt.toISOString(),
          updatedAt:
            typeof chat.updatedAt === "string"
              ? chat.updatedAt
              : chat.updatedAt.toISOString(),
        }));

        setChats(convertedChats);
        setChatPagination(redisChatsPagination);
        setLoadingChats(loadingRedisChats);
      }, timeoutMs);
    }
  }, [
    isLoaded,
    fetchModules,
    redisChats,
    redisChatsPagination,
    loadingRedisChats,
    isSignedIn,
  ]);

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
              "text-xl font-medium",
              state === "expanded" || isMobile ? "block" : "hidden"
            )}
          >
            study chat
          </Link>
          <div
            className={cn(
              "flex items-center gap-1",
              state === "collapsed" &&
                !isMobile &&
                "fixed left-[0.5rem] top-3 bg-[hsl(var(--sidebar-background))] rounded-md shadow-md"
            )}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>
                    Collapse sidebar (
                    {`${modifierKey}+${SHORTCUTS.TOGGLE_SIDEBAR}`})
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNewChat}
                    className={cn(
                      "h-9 w-9",
                      state === "collapsed" &&
                        !isMobile &&
                        "bg-[hsl(var(--sidebar-background))]"
                    )}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>New chat ({`${modifierKey}+${SHORTCUTS.NEW_CHAT}`})</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {state === "collapsed" && (
              <Dialog>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-accent h-9 w-9"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>
                        Create New Module (
                        {`${modifierKey}+${SHORTCUTS.NEW_MODULE}`})
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DialogContent>
                  <DialogTitle className="text-xl font-bold">
                    Create New Module
                  </DialogTitle>
                  <ModuleForm successEventName="module.created" />
                </DialogContent>
              </Dialog>
            )}
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
              onLoadMore={handleLoadMoreChats}
              pagination={chatPagination}
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
