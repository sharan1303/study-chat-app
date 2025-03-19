"use client";

import React from "react";
import { Send, Loader2, MessageSquare, Copy, Check } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Message, useChat } from "@ai-sdk/react";
import { toast } from "sonner";
import { ModuleWithResources } from "@/app/actions";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { encodeModuleSlug } from "@/lib/utils";

// Loading component for Suspense fallback
export function ChatPageLoading() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Main Content Area with Full-height Scrollbar */}
      <div className="flex-1 flex flex-col overflow-hidden pr-0 scroll-smooth scrollbar-smooth custom-scrollbar">
        {/* Chat Header - Skeleton */}
        <div className="py-3 flex items-center justify-between sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2 px-1 py-1">
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="h-6 w-40 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>

        {/* Chat content centered container */}
        <div className="flex-1">
          <div className="max-w-3xl mx-auto w-full transition-all duration-200">
            <div className="px-0">
              <div className="flex items-center justify-center h-screen z-20 pl-8">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading chat...</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input form skeleton */}
        <div className="sticky bottom-0 bg-transparent">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="flex-1 min-h-[69px] max-h-[120px] border-2 bg-transparent animate-pulse rounded-t-lg resize-none pr-14 w-full"></div>
              <div className="absolute right-3 bottom-3 h-10 w-10 bg-gray-200 animate-pulse rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main chat component that uses hooks
export default function ClientChatPage({
  initialModuleDetails,
  chatId,
  initialMessages = [],
  isAuthenticated = true,
}: {
  initialModuleDetails?: ModuleWithResources | null;
  chatId: string;
  initialMessages?: Message[];
  isAuthenticated?: boolean;
}) {
  // These states are used for initial values and potential future updates
  const [activeModule] = React.useState<string | null>(
    initialModuleDetails?.id ?? null
  );
  const [moduleDetails] = React.useState<ModuleWithResources | null>(
    initialModuleDetails ?? null
  );
  const router = useRouter();

  // Reference to the scroll container, but don't auto-scroll
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: chatLoading,
  } = useChat({
    api: "/api/chat",
    id: chatId,
    initialMessages,
    body: {
      moduleId: activeModule,
      chatId: chatId,
      isAuthenticated: isAuthenticated,
    },
    onResponse: (response) => {
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
          window.history.replaceState({}, "", `/chat/${chatId}`);
        } else if (activeModule && moduleDetails) {
          // For module chats, update URL to the proper format
          const encodedName = encodeModuleSlug(moduleDetails.name);

          // Check if we're on a module path without chat ID
          if (currentPath === `/${encodedName}/chat`) {
            window.history.replaceState(
              {},
              "",
              `/${encodedName}/chat/${chatId}`
            );
          }
        }
      }
    },
    onError: (error: Error) => {
      toast.error("Error: " + (error.message || "Failed to send message"));
    },
  });

  const [copiedMessageId, setCopiedMessageId] = React.useState<string | null>(
    null
  );
  // Default model name - we'll try to retrieve it dynamically if possible
  const [modelName, setModelName] = React.useState<string>("Gemini 2.0 Flash");

  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    });
  };

  const navigateToModuleDetails = () => {
    if (moduleDetails) {
      const encodedName = encodeModuleSlug(moduleDetails.name);
      router.push(`/modules/${encodedName}`);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Main Content Area with Scrollbar - Make it span the full page */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 flex flex-col ${
          messages.length > 0 ? "overflow-y-auto" : "overflow-hidden"
        } pr-0 scroll-smooth scrollbar-smooth custom-scrollbar`}
      >
        {/* Chat Header - Now inside the scrollable area */}
        {moduleDetails && (
          <div className="px-3 py-3 flex items-center justify-between sticky top-0 bg-background">
            <Button
              variant="ghost"
              className="flex items-center gap-3 -ml-3 px-1 hover:bg-muted/50 rounded"
              onClick={navigateToModuleDetails}
            >
              <span className="text-2xl">{moduleDetails.icon}</span>
              <div>
                <h1 className="font-bold text-xl">{moduleDetails.name}</h1>
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
                <div className="text-center flex items-center justify-center h-screen z-20 pl-8">
                  <div className="flex flex-col items-center space-y-4">
                    <div>
                      <MessageSquare className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">
                      Start a conversation
                    </h3>
                    <SignedIn>
                      <p className="text-muted-foreground">
                        Ask questions about your module content
                      </p>
                    </SignedIn>
                    <SignedOut>
                      <p className="text-muted-foreground">
                        Try the chat or sign in to access your modules
                      </p>
                    </SignedOut>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-8 pt-4 pb-8 pl-8 pr-6">
                  {messages.reduce(
                    (
                      result: React.ReactNode[],
                      message: Message,
                      index: number
                    ) => {
                      if (message.role === "user") {
                        // For user messages, we check if the next message is from AI
                        const nextMessage = messages[index + 1];
                        const hasAIResponse =
                          nextMessage && nextMessage.role === "assistant";

                        // Add the user message with its styling
                        result.push(
                          <div key={message.id} className="flex justify-end">
                            <div className="flex items-center gap-2 max-w-full flex-row-reverse">
                              <div className="rounded-lg px-4 py-2 bg-primary text-primary-foreground break-words">
                                <div className="whitespace-pre-wrap">
                                  {message.content}
                                </div>
                              </div>
                            </div>
                          </div>
                        );

                        // If there's an AI response to this message, add it directly below
                        if (hasAIResponse) {
                          result.push(
                            <div
                              key={nextMessage.id}
                              className="mt-4 text-gray-800 dark:text-gray-200 group relative"
                            >
                              <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                <ReactMarkdown>
                                  {nextMessage.content}
                                </ReactMarkdown>
                              </div>
                              <div className="mt-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-4">
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      nextMessage.content,
                                      nextMessage.id
                                    )
                                  }
                                  className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
                                  aria-label="Copy response"
                                >
                                  {copiedMessageId === nextMessage.id ? (
                                    <span className="flex items-center gap-1">
                                      <Check className="h-4 w-4 text-green-500" />
                                      <span>Copied!</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <Copy className="h-4 w-4" />
                                      <span>Copy Response</span>
                                    </span>
                                  )}
                                </button>
                                <div className="text-xs text-muted-foreground">
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
                            key={message.id}
                            className="text-gray-800 dark:text-gray-200 group relative"
                          >
                            <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                            <div className="mt-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-4">
                              <button
                                onClick={() =>
                                  copyToClipboard(message.content, message.id)
                                }
                                className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
                                aria-label="Copy response"
                              >
                                {copiedMessageId === message.id ? (
                                  <span className="flex items-center gap-1">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span>Copied!</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Copy className="h-4 w-4" />
                                    <span>Copy Response</span>
                                  </span>
                                )}
                              </button>
                              <div className="text-xs text-muted-foreground">
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
                  )}
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
          <div className="max-w-3xl mx-auto pl-8 pr-6">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <Textarea
                  placeholder="Type your message..."
                  value={input}
                  onChange={handleInputChange}
                  className="flex-1 min-h-[69px] max-h-[120px] border-2 rounded-t-lg rounded-b-none resize-none pr-14 w-full border-b-0"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim() && !chatLoading) {
                        const form = e.currentTarget.form;
                        if (form) form.requestSubmit();
                      }
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-3 bottom-3 h-10 w-10 rounded-full"
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
