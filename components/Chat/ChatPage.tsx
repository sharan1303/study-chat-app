"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { Message } from "@ai-sdk/react";
import { toast } from "sonner";
import { ModuleWithResources } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { encodeModuleSlug } from "@/lib/utils";
import Header from "../Main/Header";
import dynamic from "next/dynamic";

// Import the useFileChat hook for PDF support
import { useFileChat } from "@/hooks/useOptionsChat";
import { AVAILABLE_MODELS, SUPPORTED_MODELS } from "@/lib/models";

// Import the components that don't need to be loaded dynamically
import ChatInput from "./ChatInput";

// Dynamically import components that are not needed immediately
const ChatMessages = dynamic(() => import("./ChatMessages"), {
  ssr: false,
});

const WelcomeScreen = dynamic(() => import("./WelcomeScreen"), {
  loading: () => (
    <div className="text-center flex items-center justify-center h-96"></div>
  ),
  ssr: true,
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
export default function ChatPage({
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
  // Add debug log for component initialization
  console.log("ChatPage initializing with:", {
    chatId,
    initialMessagesCount: initialMessages.length,
    isNewChat,
    isAuthenticated,
  });

  // Store the optimistic chat ID
  const [optimisticChatId, setOptimisticChatId] = React.useState<string | null>(
    null
  );

  // Track if this is a new chat to update title on first message
  const [isFirstMessage, setIsFirstMessage] = React.useState(isNewChat);
  const [displayTitle, setDisplayTitle] = React.useState(
    isNewChat ? "New Chat" : initialTitle
  );

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
    } else {
      setModuleDetails(null);
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
        console.log("Connected to sidebar chat updater");
      } else {
        console.warn("Sidebar chat updater not available");
      }
    }
  }, []);

  // Load sessionId from localStorage on component mount (client-side only)
  React.useEffect(() => {
    if (typeof window !== "undefined" && !isAuthenticated) {
      // Import the session utility dynamically since it's a client-side module
      import("@/lib/anonymousSession").then(({ getOrCreateSessionId }) => {
        const storedSessionId = getOrCreateSessionId();
        if (storedSessionId) {
          console.log("Setting session ID for chat:", storedSessionId);
          setSessionId(storedSessionId);
        } else {
          console.error("Failed to get or create session ID");
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
      console.log("Adding welcome chat to sidebar with ID:", chatId);
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

  // Create stable base options that won't change across renders
  const baseOptions = React.useMemo(
    () => ({
      api: "/api/chat",
      id: chatId,
      initialMessages,
      // Include essential fields that are needed for initialization
      // but are unlikely to change during the component's lifecycle
      body: {
        // Keep minimal stable body properties here
        chatId: chatId,
        isAuthenticated: isAuthenticated,
      },
      onResponse: async (response: Response) => {
        console.log("API response received:", response.status, response.ok);

        // Try to extract model information from headers if available
        const modelHeader = response.headers.get("x-model-used");
        if (modelHeader) {
          setModelName(modelHeader);
        }

        // Get the chat ID from the response headers if available
        const responseChatId = response.headers.get("x-chat-id");
        // Also get the chat title from headers if available
        const responseChatTitle = response.headers.get("x-chat-title");

        if (responseChatId) {
          console.log("Received chat ID from API response:", responseChatId);
          console.log(
            "Received chat title from API response:",
            responseChatTitle
          );

          // If we have a new chat ID from the server, update our state
          if (optimisticChatId && responseChatId !== optimisticChatId) {
            setOptimisticChatId(responseChatId);
          }

          // Update displayed title if we get one from the server
          if (responseChatTitle) {
            setDisplayTitle(responseChatTitle);
          }

          // Directly sync the new chat with the sidebar if this was a new chat
          if (typeof window !== "undefined" && (window as any).__syncNewChat) {
            // Create a minimal chat object to sync with the sidebar
            const syncChat = {
              id: responseChatId,
              title:
                responseChatTitle || displayTitle || initialTitle || "New Chat",
              createdAt: new Date(),
              updatedAt: new Date(),
              moduleId: activeModule,
              module:
                activeModule && moduleDetails
                  ? {
                      id: moduleDetails.id,
                      name: moduleDetails.name,
                      icon: moduleDetails.icon || "\ud83d\udcda",
                    }
                  : null,
            };

            // Call the sidebar's sync function directly
            console.log(
              "Directly syncing new chat with sidebar:",
              syncChat.id,
              "title:",
              syncChat.title
            );
            (window as any).__syncNewChat(syncChat);

            // No longer the first message after we've created the chat
            setIsFirstMessage(false);
          }
        }

        // Only update URL with chat ID for authenticated users and only after a successful response
        if (isAuthenticated && response.ok) {
          // Update URL to include the chat ID after user sends a message
          const currentPath = window.location.pathname;
          const targetChatId = responseChatId || optimisticChatId || chatId;

          // Only proceed if we have a valid chat ID
          if (targetChatId) {
            console.log("Updating URL with chat ID:", targetChatId);

            // If we're on the base chat page, update the URL
            if (currentPath === "/chat" || !currentPath.includes("/chat/")) {
              // Update the URL without triggering a navigation
              if (window.history && window.history.replaceState) {
                window.history.replaceState({}, "", `/chat/${targetChatId}`);
                console.log(
                  "Updated URL without navigation to preserve messages"
                );
              }

              // Force sidebar to update via window event if available
              if (typeof window !== "undefined") {
                // 1. chatCreated - this is what the sidebar is listening for
                const chatCreatedEvent = new CustomEvent("chatCreated", {
                  detail: { chatId: targetChatId },
                });
                window.dispatchEvent(chatCreatedEvent);

                // 2. refreshChatList - as a backup
                const refreshEvent = new CustomEvent("refreshChatList", {
                  detail: { chatId: targetChatId, forceRefresh: true },
                });
                window.dispatchEvent(refreshEvent);

                console.log(
                  "Dispatched chat update events for chat ID:",
                  targetChatId
                );
              }
            } else if (activeModule && moduleDetails) {
              // For module chats, update URL to the proper format
              const encodedName = encodeModuleSlug(moduleDetails.name);

              if (encodedName) {
                // Check if we need to update the URL (if it doesn't already contain the chat ID)
                if (!currentPath.endsWith(`/${targetChatId}`)) {
                  const newPath = `/${encodedName}/chat/${targetChatId}`;
                  // Use the same history.replaceState approach to avoid navigation
                  if (window.history && window.history.replaceState) {
                    window.history.replaceState({}, "", newPath);
                    console.log(
                      "Updated module chat URL without navigation to preserve messages"
                    );
                  }
                }
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
      isAuthenticated,
      router,
      moduleDetails,
      activeModule,
      optimisticChatId,
    ]
  );

  // Initialize chat with stable options only
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    files,
    setFiles,
    webSearchEnabled,
    setWebSearchEnabled,
    selectedModel,
    setSelectedModel,
  } = useFileChat(baseOptions);

  // Keep track if we've already updated the title for first message
  const hasUpdatedTitle = React.useRef(false);

  // Keep track of messages length for scrolling
  const previousMessagesLengthRef = React.useRef(messages.length);

  // When messages change, scroll to the bottom if a new message was added
  React.useEffect(() => {
    // If a new message was added
    if (messages.length > previousMessagesLengthRef.current) {
      const newestMessage = messages[messages.length - 1];

      // If the newest message is from the user, scroll to the latest message
      if (newestMessage.role === "user" && scrollContainerRef.current) {
        // We'll let the ChatMessages component handle the scrolling
        // since it has refs to the actual message elements
      }

      // Update the reference
      previousMessagesLengthRef.current = messages.length;
    }
  }, [messages]);

  // When messages change, check if we should update the title
  React.useEffect(() => {
    // Only update title for truly new chats with their first message
    if (
      isFirstMessage &&
      messages.length > 0 &&
      messages[0].role === "user" &&
      !hasUpdatedTitle.current &&
      isNewChat && // Make sure this is actually a new chat
      (chatId === "new" || !chatId.includes("-")) // Additional check for truly new chat IDs
    ) {
      // Update the display title with the first user message
      const firstUserMessage = messages[0].content.substring(0, 50);
      const displayedTitle =
        firstUserMessage + (firstUserMessage.length >= 50 ? "..." : "");
      setDisplayTitle(displayedTitle);

      setIsFirstMessage(false);
      hasUpdatedTitle.current = true;
    }
  }, [
    messages,
    isFirstMessage,
    activeModule,
    optimisticChatId,
    chatId,
    isNewChat,
  ]);

  // Update modelName when selectedModel changes
  React.useEffect(() => {
    // Update the displayed model name based on the selected model ID
    if (selectedModel && SUPPORTED_MODELS[selectedModel]) {
      setModelName(SUPPORTED_MODELS[selectedModel]);
    }
  }, [selectedModel]);

  // Function to handle navigation to module details page
  const navigateToModuleDetails = React.useCallback(() => {
    if (moduleDetails) {
      const encodedName = encodeModuleSlug(moduleDetails.name);
      router.push(`/modules/${encodedName}`);
    }
  }, [moduleDetails, router]);

  // Handle form submission with some extra logic for first-time messages
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Only process if we have actual input or files
    const hasText = input && input.trim().length > 0;
    const hasFiles = files && files.length > 0;

    if (!hasText && !hasFiles) {
      return;
    }

    console.log("Submitting form with session ID:", sessionId);

    // If this is a first message, create an optimistic chat entry in the sidebar
    if (isFirstMessage && sidebarChatUpdater.current) {
      // Create a better chat title based on the first message
      let title = input.trim();
      if (title.length > 60) {
        title = title.substring(0, 60) + "...";
      }

      // Update the display title immediately
      setDisplayTitle(title);

      // This is the first real message, chat should be created in the database
      // and added to the sidebar now
      console.log("Creating optimistic chat with title:", title);
      const generatedOptimisticId = sidebarChatUpdater.current(
        title,
        activeModule
      );
      console.log("Generated optimistic ID:", generatedOptimisticId);

      // Store the optimistic ID for updating the URL later
      setOptimisticChatId(generatedOptimisticId);

      // No longer the first message
      setIsFirstMessage(false);
      hasUpdatedTitle.current = true;
    }

    // Build the request body with dynamic parameters
    const bodyParams: {
      moduleId: string | null;
      sessionId: string | null | undefined;
      title: string | undefined;
      forceOldest: boolean;
      optimisticChatId: string | null;
      saveHistory: boolean;
      chatId?: string;
    } = {
      moduleId: activeModule,
      sessionId: !isAuthenticated ? sessionId : undefined,
      title: displayTitle || initialTitle,
      forceOldest: forceOldest,
      optimisticChatId: optimisticChatId,
      // Always save history for new chats
      saveHistory: true,
    };

    // Ensure we have a valid chatId for new chats
    // If we're on an empty chatId and have no optimistic ID, generate one
    if ((chatId === "" || chatId === "new" || !chatId) && !optimisticChatId) {
      // Create a temporary ID using uuid if available, or timestamp
      const tempId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `temp-${Date.now()}`;

      console.log(`No chat ID available, generating temporary ID: ${tempId}`);

      // Store this ID for future use
      setOptimisticChatId(tempId);

      // Add it to the request
      bodyParams.optimisticChatId = tempId;
      bodyParams.chatId = tempId; // Also set as chatId to ensure consistency

      // Don't navigate yet - wait for the API response
    } else if (optimisticChatId) {
      // Ensure we're always including the optimistic ID if it exists
      bodyParams.optimisticChatId = optimisticChatId;
      bodyParams.chatId = chatId || optimisticChatId; // Use existing chatId or optimisticChatId
    }

    console.log("Submitting with body params:", bodyParams);

    // Pass dynamic body parameters with this specific submission
    // We'll rely on the onResponse callback to handle navigation
    handleSubmit(e as React.FormEvent<HTMLFormElement>, {
      body: bodyParams,
    });
  };

  // Handle keyboard event
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (input.trim() && !isLoading) {
          const form = e.currentTarget.form;
          if (form) form.requestSubmit();
        }
      }
    },
    [input, isLoading]
  );

  // Create a type assertion for the handleFormSubmit to match the ChatInput props
  const typedHandleFormSubmit = handleFormSubmit as (
    e: React.FormEvent
  ) => void;

  // Add logging to the chat state
  const chat = useFileChat({
    // ... existing settings ...
    onFinish: (message) => {
      console.log("Chat finished with message:", {
        id: message.id,
        content:
          typeof message.content === "string"
            ? message.content.substring(0, 100) + "..."
            : "complex content",
      });

      // ... rest of onFinish handler ...
    },
    onError: (error) => {
      console.error("Chat error:", error);
      // ... rest of onError handler ...
    },
  });

  // Add debug log to check welcome screen rendering logic
  const shouldShowWelcomeScreen = chat.messages.length === 0 && !chat.isLoading;
  console.log("Chat render state:", {
    messagesLength: chat.messages.length,
    isLoading: chat.isLoading,
    showWelcome: shouldShowWelcomeScreen,
    chatId: chatId || optimisticChatId,
  });

  return (
    <div className="flex flex-col h-screen">
      {/* Chat header */}
      <Header />

      <div
        className="flex-1 overflow-y-auto custom-scrollbar"
        ref={scrollContainerRef}
      >
        {messages.length === 0 ? (
          <WelcomeScreen
            moduleDetails={moduleDetails}
            chatId={chatId}
            modelName={modelName}
          />
        ) : (
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            modelName={modelName}
            copyToClipboard={copyToClipboard}
            copiedMessageId={copiedMessageId}
            stop={stop}
            scrollContainerRef={scrollContainerRef}
          />
        )}
      </div>

      <div>
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleFormSubmit={typedHandleFormSubmit}
          chatLoading={isLoading}
          handleKeyDown={handleKeyDown}
          handleStopGeneration={stop}
          files={files}
          setFiles={setFiles}
          webSearchEnabled={webSearchEnabled}
          setWebSearchEnabled={setWebSearchEnabled}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          availableModels={AVAILABLE_MODELS}
        />
      </div>
    </div>
  );
}
