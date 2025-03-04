"use client";

import React from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { Loader2, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import Sidebar from "@/app/components/Sidebar";

// Loading component
function SettingsPageLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <SettingsPageLoading />;
  }

  return (
    <div className="flex h-screen">
      {/* Use the shared sidebar component */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Settings Header */}
        <div className="border-b p-4">
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            <h1 className="font-bold text-2xl">Settings</h1>
          </div>
        </div>

        {/* Settings Content */}
        {!isSignedIn ? (
          <div className="flex items-center justify-center flex-1">
            <Card className="w-[400px]">
              <CardHeader>
                <CardTitle>Sign in to access settings</CardTitle>
                <CardDescription>
                  You need to be signed in to view and change your settings
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <SignInButton mode="modal">
                  <Button className="w-full">Sign in</Button>
                </SignInButton>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div className="p-4 max-w-4xl mx-auto w-full">
            <Tabs defaultValue="account">
              <TabsList className="mb-4">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              
              <TabsContent value="account">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Manage your account preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Your account is managed through Clerk. Click the user icon in the sidebar to manage your account settings.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="appearance">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance Settings</CardTitle>
                    <CardDescription>
                      Customize the look and feel of the application
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Theme preferences will be available soon.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>
                      Configure how and when you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Notification settings will be available soon.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
} 