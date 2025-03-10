"use client";

import React from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
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
        <div className="px-3 py-4 flex items-center justify-between sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2 px-3 py-2">
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
          <div className="max-w-3xl mx-auto pl-8 pr-6">
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
}: {
  initialModuleDetails?: ModuleWithResources | null;
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
    id: activeModule ? `module-${activeModule}` : undefined,
    body: {
      moduleId: activeModule,
    },
    onResponse: () => {
      // For module tracking - you could add analytics here
    },
    onError: (error: Error) => {
      toast.error("Error: " + (error.message || "Failed to send message"));
    },
  });

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
          <div className="px-3 py-4 flex items-center justify-between sticky top-0 bg-background z-10">
            <Button
              variant="ghost"
              className="flex items-center gap-2 -ml-3 px-8 hover:bg-muted/50 rounded"
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
                      <div className="mt-4">
                        <SignInButton mode="modal">
                          <Button>Sign in</Button>
                        </SignInButton>
                      </div>
                    </SignedOut>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-8 pl-8 pr-6">
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
                              className="mt-4 text-gray-800 dark:text-gray-200"
                            >
                              <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                <ReactMarkdown>
                                  {nextMessage.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                          );
                        }
                      } else if (index === 0 && message.role === "assistant") {
                        // Handle case where the first message is from the assistant
                        result.push(
                          <div
                            key={message.id}
                            className="text-gray-800 dark:text-gray-200"
                          >
                            <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
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
                  className="flex-1 min-h-[69px] max-h-[120px] border-2 rounded-t-lg resize-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-input w-full"
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
