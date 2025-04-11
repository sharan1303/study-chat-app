"use client";

import React from "react";
import { Send, Loader2, Copy, Check } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Message, useChat } from "@ai-sdk/react";
import { toast } from "sonner";
import { ModuleWithResources } from "@/lib/actions";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { encodeModuleSlug } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";
import Header from "./Header";

// Loading component for Suspense fallback
export function ChatPageLoading() {
  return (
    <div className="min-h-[calc(100vh-var(--header-height))] flex flex-col">
      <div className="flex-1 flex flex-col pr-0">
        {/* Chat Header - Make it sticky at the top like the real header */}
        <div className="py-4 px-1 pl-12 flex items-center justify-between addmarginforheaders top-0 bg-background z-10">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-md" />
            <Skeleton className="h-6 w-40" />
          </div>
        </div>

        <div className="flex-1">
          <div className="max-w-3xl mx-auto w-full transition-all duration-200">
            <div className="px-0">
              <div className="flex items-center justify-center h-screen z-20">
                <div className="flex flex-col items-center space-y-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input form skeleton */}
        <div className="sticky bottom-0 bg-transparent">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Skeleton
                variant="input"
                className="flex-1 min-h-[120px] max-h-[400px] resize-none w-full"
              />
              <Skeleton className="absolute right-3 top-3 h-10 w-10 rounded-lg bg-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
}: {
  initialModuleDetails?: ModuleWithResources | null;
  chatId: string;
  initialMessages?: Message[];
  isAuthenticated?: boolean;
  initialTitle?: string;
  forceOldest?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [showLogo, setShowLogo] = React.useState(false);

  // After mounting, we have access to the theme
  React.useEffect(() => {
    setMounted(true);
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
  const [moduleDetails] = React.useState<ModuleWithResources | null>(
    initialModuleDetails ?? null
  );
  const router = useRouter();

  // Get the session ID from local storage for anonymous users
  const [sessionId, setSessionId] = React.useState<string | null>(null);

  // Get access to the sidebar's addOptimisticChat function
  // This allows us to update the chat history immediately when sending a message
  const sidebarChatUpdater = React.useRef<
    | ((
        title: string,
        moduleId: string | null,
        forceOldest?: boolean
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
          forceOldest?: boolean
        ) => string;
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

      // If this is the welcome chat for first-time users, make sure they see the welcome message
      if (
        (chatId === "welcome-chat" || chatId.startsWith("welcome-chat-")) &&
        window.location.pathname === "/chat/welcome"
      ) {
        console.log("Welcome chat loaded for first-time user");
      }
    }
  }, [
    isAuthenticated,
    sessionId,
    initialTitle,
    forceOldest,
    activeModule,
    chatId,
  ]);

  // Reference to the scroll container, but don't auto-scroll
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

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
                console.log(`Updating URL to: ${newPath}`);
                router.replace(newPath, { scroll: false });
              }
            }
          }
        }
      },
      onError: (error: Error) => {
        toast.error("Error: " + (error.message || "Failed to send message"));
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
    ]
  );

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: chatLoading,
  } = useChat(chatOptions);

  const [copiedMessageId, setCopiedMessageId] = React.useState<string | null>(
    null
  );
  // Default model name - we'll try to retrieve it dynamically if possible
  const [modelName, setModelName] = React.useState<string>("Gemini 2.0 Flash");

  const copyToClipboard = React.useCallback(
    (text: string, messageId: string) => {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 2000);
      });
    },
    []
  );

  const navigateToModuleDetails = React.useCallback(() => {
    if (moduleDetails) {
      const encodedName = encodeModuleSlug(moduleDetails.name);
      router.push(`/modules/${encodedName}`);
    }
  }, [moduleDetails, router]);

  // Optimize message rendering with useMemo
  const renderedMessages = React.useMemo(() => {
    return messages.reduce(
      (result: React.ReactNode[], message: Message, index: number) => {
        if (message.role === "user") {
          // For user messages, we check if the next message is from AI
          const nextMessage = messages[index + 1];
          const hasAIResponse = nextMessage && nextMessage.role === "assistant";

          // Add the user message with its styling
          result.push(
            <div
              key={`user-${message.id || index}`}
              className="flex justify-end"
            >
              <div className="flex items-center gap-2 max-w-full flex-row-reverse">
                <div className="rounded-xl p-4 bg-primary text-primary-foreground break-words">
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            </div>
          );

          // If there's an AI response to this message, add it directly below
          if (hasAIResponse) {
            result.push(
              <div
                key={`ai-${nextMessage.id || `${index}-response`}`}
                className="mt-4 text-gray-800 dark:text-gray-200 group relative"
              >
                <div className="prose prose-sm dark:prose-invert max-w-none break-words prose-spacing">
                  <ReactMarkdown
                    components={{
                      h1: ({ ...props }) => (
                        <h1 className="text-2xl font-bold my-6" {...props} />
                      ),
                      h2: ({ ...props }) => (
                        <h2 className="text-xl font-semibold my-5" {...props} />
                      ),
                      h3: ({ ...props }) => (
                        <h3 className="text-lg font-medium my-4" {...props} />
                      ),
                      h4: ({ ...props }) => (
                        <h4 className="text-lg font-medium my-3" {...props} />
                      ),
                      p: ({ ...props }) => <p className="my-3" {...props} />,
                    }}
                    key={`md-${nextMessage.id || `${index}-response-md`}`}
                  >
                    {nextMessage.content}
                  </ReactMarkdown>
                </div>
                <div className="mt-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-4">
                  <button
                    key={`btn-${nextMessage.id || `${index}-response-btn`}`}
                    onClick={() =>
                      copyToClipboard(
                        nextMessage.content,
                        nextMessage.id || `${index}-response`
                      )
                    }
                    className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
                    aria-label="Copy response"
                  >
                    {copiedMessageId === nextMessage.id ? (
                      <span
                        key={`copied-${
                          nextMessage.id || `${index}-response-copied`
                        }`}
                        className="flex items-center gap-1"
                      >
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Copied!</span>
                      </span>
                    ) : (
                      <span
                        key={`copy-${
                          nextMessage.id || `${index}-response-copy`
                        }`}
                        className="flex items-center gap-1"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy Response</span>
                      </span>
                    )}
                  </button>
                  <div
                    key={`model-${nextMessage.id || `${index}-response-model`}`}
                    className="text-xs text-muted-foreground"
                  >
                    Generated with {modelName}
                  </div>
                </div>
              </div>
            );
          }
        } else if (index === 0 && message.role === "assistant") {
          // Handle case where the first message is from the assistant
          result.push(
            <div
              key={`assistant-${message.id || index}`}
              className="text-gray-800 dark:text-gray-200 group relative"
            >
              <div className="prose prose-sm dark:prose-invert max-w-none break-words prose-spacing">
                <ReactMarkdown
                  components={{
                    h1: ({ ...props }) => (
                      <h1 className="text-3xl font-bold my-6" {...props} />
                    ),
                    h2: ({ ...props }) => (
                      <h2 className="text-2xl font-semibold my-5" {...props} />
                    ),
                    h3: ({ ...props }) => (
                      <h3 className="text-xl font-medium my-4" {...props} />
                    ),
                    h4: ({ ...props }) => (
                      <h4 className="text-lg font-medium my-3" {...props} />
                    ),
                    p: ({ ...props }) => <p className="my-3" {...props} />,
                  }}
                  key={`md-assistant-${message.id || index}`}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              <div className="mt-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-4">
                <button
                  key={`btn-assistant-${message.id || index}`}
                  onClick={() =>
                    copyToClipboard(
                      message.content,
                      message.id || `assistant-${index}`
                    )
                  }
                  className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
                  aria-label="Copy response"
                >
                  {copiedMessageId === message.id ? (
                    <span
                      key={`copied-assistant-${message.id || index}`}
                      className="flex items-center gap-1"
                    >
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Copied!</span>
                    </span>
                  ) : (
                    <span
                      key={`copy-assistant-${message.id || index}`}
                      className="flex items-center gap-1"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy Response</span>
                    </span>
                  )}
                </button>
                <div
                  key={`model-assistant-${message.id || index}`}
                  className="text-xs text-muted-foreground"
                >
                  Generated with {modelName}
                </div>
              </div>
            </div>
          );
        }
        // We skip AI messages as they're handled alongside their corresponding user messages
        return result;
      },
      []
    );
  }, [messages, copiedMessageId, copyToClipboard, modelName]);

  // Add a callback for when the first message is sent
  const handleFirstMessageSent = React.useCallback(
    (message: string) => {
      // Update the chat history optimistically when the first message is sent
      if (sidebarChatUpdater.current && messages.length === 0) {
        // Create a chat title from the first message
        const chatTitle =
          message.substring(0, 30) + (message.length > 30 ? "..." : "");
        sidebarChatUpdater.current(chatTitle, activeModule, forceOldest);

        // Log for anonymous users
        if (!isAuthenticated && sessionId) {
          console.log(
            `Creating optimistic chat for anonymous user with sessionId: ${sessionId}`
          );
        }
      }
    },
    [messages.length, isAuthenticated, activeModule, sessionId, forceOldest]
  );

  // Handle form submission with optimized event handler
  const handleFormSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (input.trim() && !chatLoading) {
        // Track if this is the first message for the optimistic UI update
        const isFirstMessage = messages.length === 0;

        // Submit the form
        handleSubmit(e);

        // If this is the first message, trigger the optimistic UI update
        if (isFirstMessage) {
          handleFirstMessageSent(input.trim());
        }
      }
    },
    [input, chatLoading, handleSubmit, messages.length, handleFirstMessageSent]
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

      {/* Main Content Area with Scrollbar - Make it span the full page */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 flex flex-col ${
          messages.length > 0 ? "overflow-y-auto" : "overflow-hidden"
        } pr-0 scroll-smooth scrollbar-smooth custom-scrollbar`}
      >
        {/* Chat Header - Now inside the scrollable area */}
        {moduleDetails && (
          <div className="py-2 pl-1 pr-24 flex addmarginforheaders top-1 bg-background">
            <Button
              variant="ghost"
              className="flex items-center gap-3 pt-4 hover:bg-muted/50 rounded flex-shrink max-w-[85%]"
              onClick={navigateToModuleDetails}
            >
              <span className="text-2xl flex-shrink-0">
                {moduleDetails.icon}
              </span>
              <div className="min-w-0 overflow-hidden">
                <h1 className="text-xl truncate">{moduleDetails.name}</h1>
              </div>
            </Button>
          </div>
        )}

        {/* Chat content centered container */}
        <div className="flex-1">
          {/* Ensure chat thread has same width as input by using identical container classes */}
          <div className="max-w-3xl mx-auto w-full transition-all duration-200">
            {/* Use the same padding as the input container */}
            <div className="px-0">
              {messages.length === 0 ? (
                <div className="text-center flex items-center justify-center h-screen z-20">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-[200px] h-[175px] relative">
                      {!showLogo ? (
                        ""
                      ) : (
                        <Image
                          src={
                            mounted && resolvedTheme === "dark"
                              ? "/Study Chat Icon Dark mode.svg"
                              : "/Study Chat Icon Light mode.svg"
                          }
                          alt="Study Chat Logo"
                          width={200}
                          height={200}
                        />
                      )}
                    </div>
                    <h3 className="text-lg font-medium">
                      Welcome to Study Chat!
                    </h3>
                    <p className="text-muted-foreground">
                      Create individual modules and provide context to your chat
                      threads
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-8 pt-14 pb-8 pl-8 pr-6">
                  {renderedMessages}
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

        {/* Input form - Now inside the scrollable area but fixed at bottom */}
        <div className="sticky bottom-0 bg-transparent">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleFormSubmit}>
              <div className="relative">
                <Textarea
                  placeholder="Type your message here..."
                  value={input}
                  onChange={handleInputChange}
                  className="flex-1 min-h-[120px] max-h-[400px] border-5 rounded-t-2xl rounded-b-none resize-none  w-full border-b-0 p-4"
                  rows={4}
                  autoFocus
                  onKeyDown={handleKeyDown}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-3 top-3 h-10 w-10 rounded-lg"
                  disabled={chatLoading || !input.trim()}
                >
                  {chatLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
