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

// Loading component for Suspense fallback
export function ChatPageLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading chat...</p>
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

  return (
    <div className="flex h-screen flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat Header - Remove border-b */}
        {moduleDetails && (
          <div className="p-4 flex items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{moduleDetails.icon}</span>
              <div>
                <h1 className="font-bold text-xl">{moduleDetails.name}</h1>
                {moduleDetails.description && (
                  <p className="text-sm text-muted-foreground truncate max-w-md">
                    {moduleDetails.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat content with scrollbar at the edge */}
        <div className="flex-1 overflow-y-auto">
          {/* Centered content container */}
          <div className="max-w-3xl mx-auto w-full">
            <div className="p-4 flex items-center justify-center h-screen space-y-8 ">
              {messages.length === 0 ? (
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
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
              ) : (
                <div className="flex flex-col space-y-8">
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
                            <div className="flex items-center gap-2 max-w-[80%] flex-row-reverse">
                              <div className="rounded-lg px-4 py-2 bg-primary text-primary-foreground">
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
                              className="mt-4 mx-4 text-gray-800 dark:text-gray-200"
                            >
                              <div className="prose prose-sm dark:prose-invert max-w-none">
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
                            className="mx-4 text-gray-800 dark:text-gray-200"
                          >
                            <div className="prose prose-sm dark:prose-invert max-w-none">
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
                <div className="mx-4 mt-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input form - remove border-t and add padding */}
        <div className="pb-4">
          <div className="max-w-3xl mx-auto px-4">
            <SignedIn>
              <form onSubmit={handleSubmit}>
                <div className="flex items-start gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={input}
                    onChange={handleInputChange}
                    disabled={chatLoading}
                    className="flex-1 min-h-[60px] max-h-[120px] resize-none border-2"
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
                    size="lg"
                    className="self-end h-[60px] px-6"
                    disabled={chatLoading || !input.trim()}
                  >
                    {chatLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Send className="h-5 w-5 mr-2" />
                    )}
                    Send
                  </Button>
                </div>
              </form>
            </SignedIn>

            <SignedOut>
              <div className="flex items-start gap-2">
                <Textarea
                  placeholder="Sign in to chat with your module assistant..."
                  disabled={true}
                  className="flex-1 min-h-[60px] max-h-[120px] resize-none border-2"
                  rows={2}
                />
                <SignInButton mode="modal">
                  <Button size="lg" className="self-end h-[60px] px-6">
                    Sign in
                  </Button>
                </SignInButton>
              </div>
            </SignedOut>
          </div>
        </div>
      </div>
    </div>
  );
}
