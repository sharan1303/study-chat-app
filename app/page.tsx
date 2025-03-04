"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Send, Loader2, Layers, MessageSquare, X } from "lucide-react";
import axios from "axios";
import { useAuth, SignIn, SignUp } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<'signIn' | 'signUp'>('signIn');

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
        setShowAuthModal(true);
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
      setShowAuthModal(true);
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
    
    // If not signed in, show auth modal
    if (!isSignedIn) {
      setShowAuthModal(true);
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
    <>
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full relative">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">
                {authView === 'signIn' ? 'Sign in to continue' : 'Create an account'}
              </h2>
              <p className="text-muted-foreground">
                {authView === 'signIn' 
                  ? 'Sign in to access all features of StudyAI' 
                  : 'Create an account to save your modules and track your progress'}
              </p>
            </div>
            
            <div className="mb-4">
              {authView === 'signIn' ? (
                <SignIn 
                  afterSignInUrl="/"
                  signUpUrl="#"
                  routing="hash"
                  appearance={{
                    elements: {
                      footer: "hidden",
                      card: "shadow-none p-0",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                    }
                  }}
                />
              ) : (
                <SignUp 
                  afterSignUpUrl="/"
                  signInUrl="#"
                  routing="hash"
                  appearance={{
                    elements: {
                      footer: "hidden",
                      card: "shadow-none p-0",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                    }
                  }}
                />
              )}
            </div>
            
            <div className="text-center text-sm text-muted-foreground mt-6 pt-6 border-t">
              {authView === 'signIn' ? (
                <p>
                  Don&apos;t have an account?{' '}
                  <button 
                    className="text-primary hover:underline"
                    onClick={() => setAuthView('signUp')}
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    className="text-primary hover:underline"
                    onClick={() => setAuthView('signIn')}
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r bg-background flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Layers className="h-5 w-5" />
              <span>Your Modules</span>
            </h2>
          </div>

          <ScrollArea className="flex-1">
            {!isSignedIn ? (
              <div className="p-4 text-center text-muted-foreground">
                <p>Sign in to access your modules</p>
                <Button
                  variant="link"
                  onClick={() => setShowAuthModal(true)}
                  className="mt-2"
                >
                  Sign in
                </Button>
              </div>
            ) : loading ? (
              <div className="flex justify-center items-center h-20">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : modules.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <p>No modules found</p>
                <Button
                  variant="link"
                  onClick={() => router.push("/modules")}
                  className="mt-2"
                >
                  Create a module
                </Button>
              </div>
            ) : (
              <div className="p-2">
                {modules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => handleModuleChange(module.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg mb-1 flex items-center gap-2 transition-colors",
                      module.id === activeModule
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <span className="text-xl">{module.icon}</span>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium truncate">{module.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="p-3 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (isSignedIn) {
                  router.push("/modules");
                } else {
                  setShowAuthModal(true);
                }
              }}
            >
              Manage Modules
            </Button>
          </div>
        </div>

        {/* Main Chat Area */}
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
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Allow everyone to see the chat UI */}
            <Tabs defaultValue="chat" className="flex-1 flex flex-col">
              <div className="px-4 border-b">
                <TabsList>
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="chat"
                className="flex-1 flex flex-col p-4 overflow-hidden"
              >
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
                        placeholder="Type your message..."
                        value={input}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="flex-1 min-h-[60px] max-h-[120px] resize-none border-2"
                        rows={2}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (input.trim() && !isLoading) {
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
                        disabled={isLoading || !input.trim()}
                      >
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                          <Send className="h-5 w-5 mr-2" />
                        )}
                        Send
                      </Button>
                    </div>
                  </form>
                </div>
              </TabsContent>

              <TabsContent
                value="resources"
                className="flex-1 p-4 overflow-auto"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Module Resources</CardTitle>
                    <CardDescription>
                      Study materials and resources for this module
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!isSignedIn ? (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">
                          Sign in to access module resources
                        </p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setShowAuthModal(true)}
                        >
                          Sign in
                        </Button>
                      </div>
                    ) : !activeModule ? (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">
                          Select a module to view resources
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">
                          No resources available for this module yet
                        </p>
                        <Button variant="outline" className="mt-4">
                          Add Resources
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
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
