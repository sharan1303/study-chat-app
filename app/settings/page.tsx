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
import { Bot, ArrowLeft, Info, Trash } from "lucide-react";
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
import Image from "next/image";
import { UserProfile } from "@clerk/nextjs";
import SettingsLoading from "./loading";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import React from "react";

// Create a wrapper component for the settings content
function SettingsContent() {
  const { isLoaded, user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

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
  const imageUrl = user?.imageUrl || "/profile-circle.256x256.png";

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
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-background shadow-lg">
                <Image
                  src={imageUrl}
                  alt={fullName}
                  width={128}
                  height={128}
                  className={cn("w-full h-full object-cover")}
                />
              </div>
              <h2 className="text-2xl font-bold">{fullName}</h2>
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
                    <kbd className="px-2 py-1 rounded bg-muted text-xs">N</kbd>
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
                <TabsTrigger value="customization">Customization</TabsTrigger>
                <TabsTrigger value="history">History & Sync</TabsTrigger>
                <TabsTrigger value="models">Models</TabsTrigger>
              </TabsList>

              {/* Account Tab */}
              <TabsContent value="account">
                <Card>
                  <CardContent>
                    <div className="w-9">
                      <SignedIn>
                        <UserProfile
                          routing="hash"
                          appearance={{
                            elements: {
                              rootBox: {
                                boxShadow: "none",
                                width: "10%",
                              },
                            },
                          }}
                        />
                      </SignedIn>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Customization Tab */}
              <TabsContent value="customization">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance Settings</CardTitle>
                    <CardDescription>
                      Customize the look and feel of the application
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h3 className="font-medium">Theme Preferences</h3>
                          <p className="text-sm text-muted-foreground">
                            Your theme preference is automatically saved and
                            synced across devices
                          </p>
                        </div>
                      </div>
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

                      <div className="rounded-lg border border-destructive/50 bg-destructive/2 p-6">
                        <h3 className="text-lg font-semibold text-destructive mb-2">
                          Danger Zone
                        </h3>
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
