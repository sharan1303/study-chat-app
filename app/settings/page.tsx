"use client";

import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bot, ArrowLeft, Info, Trash, Settings, Upload } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser, useAuth, SignedIn } from "@clerk/nextjs";
import SettingsLoading from "./loading";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import React, { useRef } from "react";
import CustomUserProfile from "@/components/CustomUserProfile";
import EditableProfileImage from "@/components/EditableProfileImage";

// Create a wrapper component for the settings content
function SettingsContent() {
  const { isLoaded, user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);

        if (!Array.isArray(jsonData)) {
          toast.error("Invalid JSON format. Expected an array of modules.");
          return;
        }

        // Process the imported modules
        toast.success(`Successfully imported ${jsonData.length} modules`);

        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
        toast.error("Failed to parse JSON file. Please check the file format.");
      }
    };

    reader.readAsText(file);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteAllModules = async () => {
    try {
      const response = await fetch("/api/modules/clear", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete modules");
      }

      toast.success("All modules deleted successfully");
      setIsDeleteDialogOpen(false);

      window.location.reload();
    } catch (error) {
      console.error("Error deleting modules:", error);
      toast.error("Failed to delete modules");
    }
  };

  // AI models available in the application
  const aiModels = [
    {
      name: "Gemini 2.0 Flash",
      provider: "Google",
      features: ["Fast responses", "Used as default model"],
      status: "Active",
    },
    {
      name: "Perplexity Search",
      provider: "Perplexity",
      features: ["Web search capabilities", "Up-to-date information"],
      status: "Active when search needed",
    },
    {
      name: "Future model support",
      provider: "Various",
      features: ["Multiple AI models", "Specialized use cases"],
      status: "Coming soon",
    },
  ] as const;

  const handleDeleteAllChats = async () => {
    try {
      const response = await fetch("/api/chat/clear", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat history");
      }

      toast.success("Chat history deleted successfully");
      setIsDeleteDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error deleting chat history:", error);
      toast.error("Failed to delete chat history");
    }
  };

  if (!isLoaded) {
    return <SettingsLoading />;
  }

  const fullName = user?.fullName || user?.firstName || "User";
  const email = user?.primaryEmailAddress?.emailAddress || "";

  return (
    <div className="h-full flex flex-col py-2.5">
      {/* Top navigation bar */}
      <div className="flex justify-between items-center pr-6">
        <Button variant="ghost" size="sm" asChild className="flex items-center">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SignedIn>
            <Button
              variant="destructive"
              size="sm"
              className="w-fit"
              onClick={() => signOut()}
            >
              Sign out
            </Button>
          </SignedIn>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
          {/* Left sidebar with user info */}
          <div className="w-full md:w-1/3">
            <div className="flex flex-col items-center text-center mb-6 mt-10">
              <EditableProfileImage size={128} />
              <h2 className="text-2xl font-bold mt-4">{fullName}</h2>
              <p className="text-muted-foreground">{email}</p>
              <Badge variant="secondary" className="mt-2">
                Free Plan
              </Badge>
            </div>

            {/* Messsage Usage Card */}
            {/* <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Message Usage
                </CardTitle>
                <CardDescription>Resets tomorrow at 12:00 AM</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Standard</span>
                    <span>10/20</span>
                  </div>
                  <Progress value={50} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    10 messages remaining
                  </p>
                </div>
              </CardContent>
            </Card> */}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Keyboard Shortcuts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Search</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 rounded bg-muted text-xs">⌘</kbd>
                    <kbd className="px-2 py-1 rounded bg-muted text-xs">K</kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">New Chat</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 rounded bg-muted text-xs">⌘</kbd>
                    <kbd className="px-2 py-1 rounded bg-muted text-xs">O</kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Toggle Sidebar</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 rounded bg-muted text-xs">⌘</kbd>
                    <kbd className="px-2 py-1 rounded bg-muted text-xs">B</kbd>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side with settings tabs */}
          <div className="flex-1 py-0.5">
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="modules">Modules</TabsTrigger>
                <TabsTrigger value="history">History & Sync</TabsTrigger>
                <TabsTrigger value="models">Models</TabsTrigger>
              </TabsList>

              {/* Account Tab */}
              <TabsContent value="account">
                <CustomUserProfile />
              </TabsContent>

              {/* Modules and sync Tab */}
              <TabsContent value="modules">
                <Card>
                  <CardHeader>
                    <CardTitle>Manage Modules</CardTitle>
                    <CardDescription>
                      Import modules from a JSON file or view module usage
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        Import a JSON file containing module configurations. The
                        file should contain an array of module objects.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept=".json"
                          ref={fileInputRef}
                          onChange={handleFileImport}
                          className="hidden"
                          aria-label="Import modules JSON file"
                        />
                        <Button onClick={handleImportClick} className="w-full">
                          <Upload className="h-4 w-4 mr-2" />
                          Import Modules from JSON
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">Module Analytics</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Track and visualize module usage, performance
                              metrics, and resource consumption
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                toast.success("Module Analytics opened")
                              }
                            >
                              <Settings className="h-5 w-5" />
                              See Usage
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
                      <h3 className="text-2xl font-bold mb-2">Danger Zone</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Permanently remove all installed modules from your
                        application.
                      </p>
                      <AlertDialog
                        open={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            className="w-full sm:w-auto"
                          >
                            <Trash className="w-4 h-4 mr-2" />
                            Delete All Modules
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete all installed modules from your
                              application. Your application will return to its
                              basic functionality.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteAllModules}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete All Modules
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>History & Sync Settings</CardTitle>
                    <CardDescription>
                      Manage your chat history and synchronization preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h3 className="font-medium">Save Chat History</h3>
                          <p className="text-sm text-muted-foreground">
                            Keep a record of your conversations
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h3 className="font-medium">Sync Across Devices</h3>
                          <p className="text-sm text-muted-foreground">
                            Access your chats on all your devices
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <Separator className="my-6" />

                      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
                        <h3 className="text-2xl font-bold mb-2">Danger Zone</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Permanently delete your history from both your local
                          device and our servers.*
                        </p>
                        <AlertDialog
                          open={isDeleteDialogOpen}
                          onOpenChange={setIsDeleteDialogOpen}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="w-full sm:w-auto"
                            >
                              <Trash className="w-4 h-4 mr-2" />
                              Delete Chat History
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete all your chat history from
                                our servers and remove all chat data from your
                                local device.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteAllChats}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete All Chats
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Models Tab */}
              <TabsContent value="models">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Models</CardTitle>
                    <CardDescription>
                      Information about the AI models used in the application
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        <p className="text-sm text-muted-foreground">
                          The application automatically selects the best AI
                          model for your needs.
                        </p>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Model</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Features</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {aiModels.map((model, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <Bot className="h-4 w-4 mr-2 text-primary" />
                                {model.name}
                              </div>
                            </TableCell>
                            <TableCell>{model.provider}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {model.features.map((feature, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  model.status === "Active"
                                    ? "default"
                                    : model.status === "Coming soon"
                                    ? "outline"
                                    : "secondary"
                                }
                              >
                                {model.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with suspense boundary
export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";
