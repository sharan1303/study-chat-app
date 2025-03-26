"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Plus, Github, Mail, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

// Form schema for validation
const profileFormSchema = z.object({
  username: z.string().min(4, "Username must be at least 4 characters long"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function CustomUserProfile() {
  const { isLoaded, user } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);
  const [initialUsername, setInitialUsername] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Set up form with default values from user metadata
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
    },
  });

  // Load user's username when component mounts
  useEffect(() => {
    if (isLoaded && user) {
      const usernameValue = user.username || user.firstName || "";
      form.setValue("username", usernameValue);
      setInitialUsername(usernameValue);
    }
  }, [isLoaded, user, form]);

  // Check for changes when input changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      setHasChanges(value.username !== initialUsername);
    });
    return () => subscription.unsubscribe();
  }, [form, initialUsername]);

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading profile...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsUpdating(true);

      // Update username using Clerk's native username update
      await user?.update({
        username: data.username,
      });

      // Update the initial value after successful save
      setInitialUsername(data.username);
      setHasChanges(false);
      toast.success("Username updated successfully");
    } catch (error) {
      console.error("Error updating username:", error);
      toast.error("Failed to update username");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddEmail = () => {
    user?.createEmailAddress({
      email: "",
    });
  };

  const handleRemoveAccount = (provider: string) => {
    try {
      const accountId = user?.externalAccounts.find(
        (acc) => acc.provider === provider
      )?.id;

      if (accountId) {
        // We need to redirect the user to Clerk's account connection page
        // where they can manage their connections
        toast.info(
          `To disconnect your ${provider} account, please use the Account settings page`
        );

        // Optional: Open Account settings in a new tab
        window.open(`https://accounts.clerk.dev/user/connections`, "_blank");
      }
    } catch (error) {
      console.error(`Error handling ${provider} account:`, error);
      toast.error(`An error occurred. Please try again.`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Username Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">
                What should Study Chat call you?
              </h2>
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl className="flex-grow border-spacing-5">
                        <Input
                          placeholder="Enter your name"
                          className="border-[#868d978e] dark:border-[#717d8d81] border-[1px]"
                          {...field}
                        />
                      </FormControl>
                      {hasChanges && (
                        <Button type="submit" disabled={isUpdating} size="sm">
                          {isUpdating && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Save
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-2"></div>
          </form>
        </Form>

        {/* Email Addresses */}
        <div className="pt-4 border-t">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-medium">Email addresses</h3>
          </div>
          <div className="space-y-3">
            {user?.emailAddresses.map((email) => (
              <div key={email.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm text-foreground">
                    {email.emailAddress}
                  </span>
                  {email.id === user.primaryEmailAddressId && (
                    <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-md">
                      Primary
                    </span>
                  )}
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleAddEmail}
            >
              <Plus className="h-4 w-4 mr-1" /> Add email address
            </Button>
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="pt-4 border-t">
          <h3 className="mb-3 text-lg font-medium">Connected accounts</h3>
          <div className="space-y-3">
            {/* GitHub */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                <span className="text-sm font-medium">GitHub</span>
                {user?.externalAccounts.find(
                  (acc) => acc.provider === "github"
                ) ? (
                  <span className="text-sm text-muted-foreground">
                    •{" "}
                    {
                      user?.externalAccounts.find(
                        (acc) => acc.provider === "github"
                      )?.username
                    }
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Not connected
                  </span>
                )}
              </div>
              {user?.externalAccounts.find(
                (acc) => acc.provider === "github"
              ) ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleRemoveAccount("github")}
                    >
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" size="sm" className="text-xs">
                  Connect
                </Button>
              )}
            </div>

            {/* Google */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <span className="text-sm font-medium">Google</span>
                {user?.externalAccounts.find(
                  (acc) => acc.provider === "google"
                ) ? (
                  <span className="text-sm text-muted-foreground">
                    •{" "}
                    {
                      user?.externalAccounts.find(
                        (acc) => acc.provider === "google"
                      )?.emailAddress
                    }
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Not connected
                  </span>
                )}
              </div>
              {user?.externalAccounts.find(
                (acc) => acc.provider === "google"
              ) ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleRemoveAccount("google")}
                    >
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" size="sm" className="text-xs">
                  Connect
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
