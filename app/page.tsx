"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Send, Loader2, MessageSquare } from "lucide-react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";

import Sidebar from "@/app/components/Sidebar";

interface Module {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  lastStudied: string | null;
}

// Loading component for Suspense fallback
function ChatPageLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading chat...</p>
      </div>
    </div>
  );
}

// Auth checking component that passes auth state to ChatPageContent instead of conditionally rendering
function AuthCheck() {
  const { isLoaded, isSignedIn } = useAuth();
  
  // Show loading while clerk is initializing
  if (!isLoaded) {
    return <ChatPageLoading />;
  }
  
  // Render the chat content for both signed in and guest users
  return <ChatPageContent isSignedIn={!!isSignedIn} />;
}

// Main chat component that uses hooks
function ChatPageContent({ isSignedIn }: { isSignedIn: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const moduleParam = searchParams.get("module");

  const [activeModule, setActiveModule] = useState<string | null>(moduleParam);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModules = useCallback(async () => {
    // Only fetch modules if signed in
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.get("/api/modules");
      setModules(response.data);

      // Only update the route if needed and we have modules
      if (!activeModule && response.data.length > 0) {
        const firstModuleId = response.data[0].id;
        setActiveModule(firstModuleId);
        // Use scroll:false to avoid page jump
        router.push(`/?module=${firstModuleId}`, { scroll: false });
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
      toast.error("Failed to load modules");
    } finally {
      setLoading(false);
    }
  }, [activeModule, router, isSignedIn]);

  // Only fetch modules when the component is mounted and user is signed in
  useEffect(() => {
    // Use a small delay to prevent immediate loading
    const timer = setTimeout(() => {
      fetchModules();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [fetchModules]);

  const updateModuleLastStudied = useCallback(
    async (moduleId: string) => {
      if (!isSignedIn) {
        // Use Clerk's SignInButton instead of custom modal
        return;
      }
      
      try {
        const currentModule = modules.find((m) => m.id === moduleId);
        if (!currentModule) return;

        await axios.put(`/api/modules/${moduleId}/last-studied`, {});

        // Update local state
        setModules(
          modules.map((m) =>
            m.id === moduleId
              ? {
                  ...m,
                  lastStudied: new Date().toISOString(),
                }
              : m
          )
        );
      } catch (error) {
        console.error("Error updating module last studied time:", error);
      }
    },
    [modules, isSignedIn]
  );

  // Only update active module when URL changes, not on first render
  useEffect(() => {
    if (moduleParam && moduleParam !== activeModule) {
      setActiveModule(moduleParam);
      if (isSignedIn) {
        updateModuleLastStudied(moduleParam);
      }
    }
  }, [moduleParam, updateModuleLastStudied, activeModule, isSignedIn]);

  const { messages, input, handleInputChange, status, append } = useChat({
    api: "/api/chat",
    id: activeModule ? `module-${activeModule}` : undefined,
    body: {
      moduleId: activeModule,
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  const handleModuleChange = (moduleId: string) => {
    if (!isSignedIn) {
      return;
    }
    router.push(`/?module=${moduleId}`);
    setActiveModule(moduleId);
    updateModuleLastStudied(moduleId);
  };

  // Function to manually send messages only when a module is selected
  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // If not signed in, no need for custom modal
    if (!isSignedIn) {
      return;
    }

    if (!activeModule) {
      toast.error("Please select a module first");
      return;
    }

    append({
      role: "user",
      content: input,
    });
  };

  const currentModule = modules.find((m) => m.id === activeModule);

  return (
    <div className="flex h-screen">
      {/* Use the shared sidebar component */}
      <Sidebar 
        modules={modules}
        loading={loading}
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        {currentModule && (
          <div className="border-b p-4 flex items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentModule.icon}</span>
              <div>
                <h1 className="font-bold text-lg">{currentModule.name}</h1>
                {currentModule.description && (
                  <p className="text-sm text-muted-foreground truncate max-w-md">
                    {currentModule.description}
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
                  <p className="text-muted-foreground">
                    {isSignedIn 
                      ? "Ask questions about your module content" 
                      : "Try the chat or sign in to access your modules"}
                  </p>
                  
                  {!isSignedIn && (
                    <div className="mt-4">
                      <SignInButton mode="modal">
                        <Button>Sign in</Button>
                      </SignInButton>
                    </div>
                  )}
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
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
                        <div className="prose dark:prose-invert">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
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
            <form onSubmit={handleSendMessage}>
              <div className="flex items-start gap-2">
                <Textarea
                  placeholder={!isSignedIn 
                    ? "Sign in to chat with your module assistant..." 
                    : "Type your message..."}
                  value={input}
                  onChange={handleInputChange}
                  disabled={isLoading || !isSignedIn}
                  className="flex-1 min-h-[60px] max-h-[120px] resize-none border-2"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim() && !isLoading && isSignedIn) {
                        const form = e.currentTarget.form;
                        if (form) form.requestSubmit();
                      }
                    }
                  }}
                />
                {isSignedIn ? (
                  <Button
                    type="submit"
                    size="lg"
                    className="self-end h-[60px] px-6"
                    disabled={isLoading || !input.trim()}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Send className="h-5 w-5 mr-2" />
                    )}
                    Send
                  </Button>
                ) : (
                  <SignInButton mode="modal">
                    <Button
                      size="lg"
                      className="self-end h-[60px] px-6"
                    >
                      Sign in
                    </Button>
                  </SignInButton>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the page component with Suspense
export default function Home() {
  return (
    <Suspense fallback={<ChatPageLoading />}>
      <AuthCheck />
    </Suspense>
  );
}
