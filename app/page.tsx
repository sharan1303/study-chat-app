"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Send, Loader2, Layers, MessageSquare } from "lucide-react";
import axios from "axios";

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

// Main chat component that uses hooks
function ChatPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const moduleParam = searchParams.get("module");

  const [activeModule, setActiveModule] = useState<string | null>(moduleParam);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/modules");
      setModules(response.data);

      // If no module is selected but we have modules, select the first one
      if (!activeModule && response.data.length > 0) {
        setActiveModule(response.data[0].id);
        router.push(`/?module=${response.data[0].id}`, { scroll: false });
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
      toast.error("Failed to load modules");
    } finally {
      setLoading(false);
    }
  }, [activeModule, router]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const updateModuleLastStudied = useCallback(
    async (moduleId: string) => {
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
    [modules]
  );

  // Update active module when URL changes
  useEffect(() => {
    if (moduleParam) {
      setActiveModule(moduleParam);
      // Update last studied time when a module is selected
      if (moduleParam) {
        updateModuleLastStudied(moduleParam);
      }
    }
  }, [moduleParam, updateModuleLastStudied]);

  const { messages, input, handleInputChange, status, append } = useChat({
    api: "/api/chat",
    id: activeModule ? `module-${activeModule}` : undefined,
    body: {
      moduleId: activeModule,
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  const handleModuleChange = (moduleId: string) => {
    router.push(`/?module=${moduleId}`);
    setActiveModule(moduleId);
    updateModuleLastStudied(moduleId);
  };

  // Function to manually send messages only when a module is selected
  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeModule || !input.trim()) return;

    append({
      role: "user",
      content: input,
    });
  };

  const currentModule = modules.find((m) => m.id === activeModule);

  return (
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
          {loading ? (
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
            onClick={() => router.push("/modules")}
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
          {!activeModule ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-6 max-w-md">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Select a module to start chatting
                </h3>
                <p className="text-muted-foreground">
                  Choose a module from the sidebar to begin your conversation
                </p>
              </div>
            </div>
          ) : (
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
                          Ask questions about your module content
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
                        placeholder={
                          activeModule
                            ? "Type your message..."
                            : "Select a module to start chatting"
                        }
                        value={input}
                        onChange={handleInputChange}
                        disabled={isLoading || !activeModule}
                        className="flex-1 min-h-[60px] max-h-[120px] resize-none border-2"
                        rows={2}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (input.trim() && activeModule && !isLoading) {
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
                        disabled={isLoading || !activeModule || !input.trim()}
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
                    {!activeModule ? (
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
          )}
        </div>
      </div>
    </div>
  );
}

// Export the page component with Suspense
export default function Home() {
  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ChatPageContent />
    </Suspense>
  );
}
