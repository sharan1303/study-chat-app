"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { Message, useChat } from "@ai-sdk/react";
import { toast } from "sonner";
import { ModuleWithResources } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { encodeModuleSlug } from "@/lib/utils";
import Header from "../Main/Header";
import dynamic from "next/dynamic";

// Import the components that don't need to be loaded dynamically
import ChatInput from "./ChatInput";
import ChatModuleHeader from "./ChatModuleHeader";

// Dynamically import components that are not needed immediately
const ChatMessages = dynamic(() => import("./ChatMessages"), {
  loading: () => (
    <div className="flex-1 overflow-y-auto p-4">
      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
    </div>
  ),
  ssr: false,
});

const WelcomeScreen = dynamic(() => import("./WelcomeScreen"), {
  loading: () => (
    <div className="text-center flex items-center justify-center h-96"></div>
  ),
  ssr: false,
});

/**
 * Renders a full-screen chat interface with message history, input, and an optional module header.
 *
 * This component manages the chat session by handling message submission with optimistic UI updates,
 * dynamically updating the chat model based on API responses, and adjusting the browser URL for authenticated users.
 * It also retrieves a session ID for anonymous users and provides clipboard functionality for copying responses.
 *
 * @param initialModuleDetails - Optional module details used to display context-specific header information.
 * @param chatId - Unique identifier for the chat session.
 * @param initialMessages - Array of messages to initialize the chat conversation.
 * @param isAuthenticated - Indicates whether the user is authenticated (defaults to true).
 * @param initialTitle - Optional initial title for the chat.
 * @param forceOldest - When true, ensures this chat appears as the oldest in history (for unauthenticated users).
 * @param isNewChat - When true, shows as "New Chat" in the UI until first message
 *
 * @returns The rendered chat interface as a React element.
 */
export default function ClientChatPage({
  initialModuleDetails,
  chatId,
  initialMessages = [],
  isAuthenticated = true,
  initialTitle,
  forceOldest = false,
  isNewChat = false,
}: {
  initialModuleDetails?: ModuleWithResources | null;
  chatId: string;
  initialMessages?: Message[];
  isAuthenticated?: boolean;
  initialTitle?: string;
  forceOldest?: boolean;
  isNewChat?: boolean;
}) {
  const [showLogo, setShowLogo] = React.useState(false);

  // Store the optimistic chat ID
  const [optimisticChatId, setOptimisticChatId] = React.useState<string | null>(
    null
  );

  // Track if this is a new chat to update title on first message
  const [isFirstMessage, setIsFirstMessage] = React.useState(isNewChat);
  const [displayTitle, setDisplayTitle] = React.useState(
    isNewChat ? "New Chat" : initialTitle
  );

  // After mounting, we have access to the theme
  React.useEffect(() => {
    // Add a small delay before showing the logo to prevent flashing
    const timer = setTimeout(() => {
      setShowLogo(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // These states are used for initial values and potential future updates
  const [activeModule] = React.useState<string | null>(
    initialModuleDetails?.id ?? null
  );
  const [moduleDetails, setModuleDetails] =
    React.useState<ModuleWithResources | null>(initialModuleDetails ?? null);

  // Update moduleDetails when initialModuleDetails changes
  React.useEffect(() => {
    if (initialModuleDetails) {
      setModuleDetails(initialModuleDetails);
    }
  }, [initialModuleDetails]);

  const router = useRouter();

  // Get the session ID from local storage for anonymous users
  const [sessionId, setSessionId] = React.useState<string | null>(null);

  // Get access to the sidebar's addOptimisticChat function
  // This allows us to update the chat history immediately when sending a message
  const sidebarChatUpdater = React.useRef<
    | ((
        title: string,
        moduleId: string | null,
        forceOldest?: boolean,
        currentPath?: string
      ) => string)
    | null
  >(null);

  // Connect to the optimistic chat updater if available in the global window object
  React.useEffect(() => {
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
      if (win.__sidebarChatUpdater) {
        sidebarChatUpdater.current = win.__sidebarChatUpdater;
      }
    }
  }, []);

  // Load sessionId from localStorage on component mount (client-side only)
  React.useEffect(() => {
    if (typeof window !== "undefined" && !isAuthenticated) {
      // Import the session utility dynamically since it's a client-side module
      import("@/lib/session").then(({ getOrCreateSessionIdClient }) => {
        const storedSessionId = getOrCreateSessionIdClient();
        if (storedSessionId) {
          setSessionId(storedSessionId);
        }
      });
    }
  }, [isAuthenticated]);

  // For the welcome chat, add it to history for anonymous users on initial load
  React.useEffect(() => {
    if (
      !isAuthenticated &&
      sessionId &&
      initialTitle &&
      sidebarChatUpdater.current &&
      // Specifically check for the welcome chat
      (forceOldest ||
        chatId === "welcome-chat" ||
        chatId.startsWith("welcome-chat-"))
    ) {
      // Add the welcome chat to the sidebar for anonymous users
      sidebarChatUpdater.current(initialTitle, activeModule, true);
    }
  }, [
    isAuthenticated,
    sessionId,
    initialTitle,
    forceOldest,
    activeModule,
    chatId,
  ]);

  // Reference to the scroll container - needed for auto-scrolling
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Default model name - we'll try to retrieve it dynamically if possible
  const [modelName, setModelName] = React.useState<string>("Gemini 2.0 Flash");

  // Track if the user has copied a message
  const [copiedMessageId, setCopiedMessageId] = React.useState<string | null>(
    null
  );

  const copyToClipboard = React.useCallback(
    (text: string, messageId: string) => {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 2000);
      });
    },
    []
  );

  // Memoize the chat options to prevent unnecessary re-initialization
  const chatOptions = React.useMemo(
    () => ({
      api: "/api/chat",
      id: chatId,
      initialMessages,
      body: {
        moduleId: activeModule,
        chatId: chatId,
        isAuthenticated: isAuthenticated,
        sessionId: !isAuthenticated ? sessionId : undefined,
        title: initialTitle,
        forceOldest: forceOldest,
        optimisticChatId: optimisticChatId,
      },
      onResponse: (response: Response) => {
        // Try to extract model information from headers if available
        const modelHeader = response.headers.get("x-model-used");
        if (modelHeader) {
          setModelName(modelHeader);
        }

        // Only update URL with chat ID for authenticated users
        if (isAuthenticated) {
          // Update URL to include the chat ID after user sends a message
          const currentPath = window.location.pathname;

          // Make sure chatId is defined before updating URL
          if (!chatId) {
            console.error("Error: chatId is undefined");
            return;
          }

          if (currentPath === "/chat" && !activeModule) {
            // Only update URL if we're on the main chat page and not in a module
            router.replace(`/chat/${chatId}`, { scroll: false });
          } else if (activeModule && moduleDetails) {
            // For module chats, update URL to the proper format
            const encodedName = encodeModuleSlug(moduleDetails.name);

            // More flexible path handling for module chats
            // This will work for both initial module chat pages and existing chat pages
            if (currentPath.includes(`/${encodedName}/chat`)) {
              // Check if we need to update the URL (if it doesn't already contain the chat ID)
              if (!currentPath.endsWith(`/${chatId}`)) {
                const newPath = `/${encodedName}/chat/${chatId}`;
                router.replace(newPath, { scroll: false });
              }
            }
          }
        }
      },
      onError: (error: Error) => {
        toast.error(`Error: ${error.message || "Failed to send message"}`);
      },
    }),
    [
      chatId,
      initialMessages,
      activeModule,
      isAuthenticated,
      moduleDetails,
      sessionId,
      router,
      initialTitle,
      forceOldest,
      optimisticChatId,
    ]
  );

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: chatLoading,
  } = useChat(chatOptions);

  // Keep track if we've already updated the title for first message
  const hasUpdatedTitle = React.useRef(false);

  // When messages change, check if we should update the title
  React.useEffect(() => {
    if (
      isFirstMessage &&
      messages.length > 0 &&
      messages[0].role === "user" &&
      !hasUpdatedTitle.current
    ) {
      // Update the display title with the first user message
      const firstUserMessage = messages[0].content.substring(0, 50);
      const displayedTitle =
        firstUserMessage + (firstUserMessage.length >= 50 ? "..." : "");
      setDisplayTitle(displayedTitle);

      setIsFirstMessage(false);
      hasUpdatedTitle.current = true;
    }
  }, [messages, isFirstMessage, activeModule, optimisticChatId, chatId]);

  // Function to handle navigation to module details page
  const navigateToModuleDetails = React.useCallback(() => {
    if (moduleDetails) {
      const encodedName = encodeModuleSlug(moduleDetails.name);
      router.push(`/modules/${encodedName}`);
    }
  }, [moduleDetails, router]);

  // Handle form submission with optimized event handler
  const handleFormSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (input.trim() && !chatLoading) {
        // For new chats, add an optimistic entry to the sidebar when sending first message
        if (isNewChat && messages.length === 0 && sidebarChatUpdater.current) {
          // Create a first message-based title
          const title =
            input.trim().substring(0, 50) + (input.length > 50 ? "..." : "");

          // Save the current path to help with maintaining the active state
          const currentPath = window.location.pathname;

          // Add the chat optimistically to the sidebar and store the ID
          const newOptimisticId = sidebarChatUpdater.current(
            title,
            activeModule,
            false,
            currentPath
          );
          if (newOptimisticId) {
            setOptimisticChatId(newOptimisticId);
          }
        }

        handleSubmit(e);
      }
    },
    [
      input,
      chatLoading,
      handleSubmit,
      isNewChat,
      messages.length,
      sidebarChatUpdater,
      activeModule,
    ]
  );

  // Handle keyboard event
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (input.trim() && !chatLoading) {
          const form = e.currentTarget.form;
          if (form) form.requestSubmit();
        }
      }
    },
    [input, chatLoading]
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header component */}
      <Header />

      {/* Module Header - Fixed position */}
      {moduleDetails && (
        <ChatModuleHeader
          moduleDetails={moduleDetails}
          navigateToModuleDetails={navigateToModuleDetails}
        />
      )}

      {/* Main Content Area with Scrollbar - Make it span the full page */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 flex flex-col ${
          messages.length > 0 ? "overflow-y-auto" : "overflow-hidden"
        } pr-0 scroll-smooth scrollbar-smooth custom-scrollbar`}
      >
        {/* Chat content centered container */}
        <div className="flex-1">
          {/* Ensure chat thread has same width as input by using identical container classes */}
          <div className="max-w-3xl mx-auto transition-all duration-200">
            {/* Use the same padding as the input container */}
            <div className="px-0">
              {messages.length === 0 ? (
                <WelcomeScreen showLogo={showLogo} />
              ) : (
                <div className="flex flex-col space-y-8 pt-14 px-4 pb-8">
                  <ChatMessages
                    messages={messages}
                    copiedMessageId={copiedMessageId}
                    copyToClipboard={copyToClipboard}
                    modelName={modelName}
                  />
                </div>
              )}
              {chatLoading && (
                <div className="pl-8 pr-6 mt-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input form - Now using the ChatInput component */}
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleFormSubmit={handleFormSubmit}
          chatLoading={chatLoading}
          handleKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
