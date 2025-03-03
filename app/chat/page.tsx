"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, Send, Loader2, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChat } from "@ai-sdk/react";
import { ModulesDialog } from "@/components/modules-dialog";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const moduleParam = searchParams.get("module");

  const [activeModule, setActiveModule] = useState(moduleParam || "cs101");
  const [showModulesDialog, setShowModulesDialog] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
      body: {
        moduleId: activeModule,
      },
    });

  const modules = [
    { id: "cs101", name: "Computer Science 101", icon: "💻" },
    { id: "math201", name: "Advanced Mathematics", icon: "🧮" },
    { id: "phys150", name: "Physics Fundamentals", icon: "⚛️" },
    { id: "bio220", name: "Molecular Biology", icon: "🧬" },
  ];

  const handleModuleSelect = (moduleId: string) => {
    setActiveModule(moduleId);
    setShowModulesDialog(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Button variant="ghost" className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span className="font-bold">StudyAI</span>
            </Button>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModulesDialog(true)}
              className="flex items-center gap-1"
            >
              <Layers className="h-4 w-4" />
              <span>Modules</span>
            </Button>
            <Select value={activeModule} onValueChange={setActiveModule}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    <div className="flex items-center">
                      <span className="mr-2">{module.icon}</span>
                      <span>{module.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col md:flex-row">
        <div className="hidden border-r md:block md:w-80 lg:w-96">
          <div className="p-4">
            <Tabs defaultValue="modules">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="modules">Modules</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>
              <TabsContent value="modules" className="mt-4 space-y-4">
                {modules.map((module) => (
                  <Card
                    key={module.id}
                    className={`cursor-pointer hover:bg-muted ${
                      activeModule === module.id ? "border-primary" : ""
                    }`}
                    onClick={() => setActiveModule(module.id)}
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg flex items-center">
                        <span className="mr-2 text-2xl">{module.icon}</span>
                        {module.name}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </TabsContent>
              <TabsContent value="resources" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Study Resources</CardTitle>
                    <CardDescription>
                      Upload or link to your study materials
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Upload Materials</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">Start a conversation</h2>
                    <p className="text-muted-foreground">
                      Ask questions about{" "}
                      {modules.find((m) => m.id === activeModule)?.name ||
                        "your module"}
                    </p>
                  </div>
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
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex items-center mb-1">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarFallback>
                              {modules.find((m) => m.id === activeModule)
                                ?.icon || "AI"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">
                            {modules.find((m) => m.id === activeModule)?.name ||
                              "Study Assistant"}
                          </span>
                        </div>
                      )}
                      <p>{message.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="border-t p-4">
            <form
              onSubmit={handleSubmit}
              className="flex items-center space-x-2"
            >
              <Input
                placeholder={`Ask about ${
                  modules.find((m) => m.id === activeModule)?.name ||
                  "your module"
                }...`}
                value={input}
                onChange={handleInputChange}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>

      <ModulesDialog
        open={showModulesDialog}
        onOpenChange={setShowModulesDialog}
        onModuleSelect={handleModuleSelect}
      />
    </div>
  );
}
