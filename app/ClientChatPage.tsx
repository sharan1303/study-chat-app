"use client";

import React from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChat } from "ai";
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
    onError: (error) => {
      toast.error("Error: " + (error.message || "Failed to send message"));
    },
  });

  return (
    <div className="flex h-screen">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        {moduleDetails && (
          <div className="border-b p-4 flex items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{moduleDetails.icon}</span>
              <div>
                <h1 className="font-bold text-lg">{moduleDetails.name}</h1>
                {moduleDetails.description && (
                  <p className="text-sm text-muted-foreground truncate max-w-md">
                    {moduleDetails.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-4">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto mb-4 pr-4">
            <div className="space-y-4 pb-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
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
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex items-start gap-2 max-w-[80%] ${
                        message.role === "user"
                          ? "flex-row-reverse"
                          : "flex-row"
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {message.role === "user" ? "U" : "AI"}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.role === "user" ? (
                          <div className="whitespace-pre-wrap">
                            {message.content}
                          </div>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2 max-w-[80%]">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg bg-muted px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input form */}
          <div className="border-t pt-4">
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
