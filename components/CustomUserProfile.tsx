"use client";

import { useState, useEffect } from "react";
import { useUser, UserProfile } from "@clerk/nextjs";
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
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Plus, X, Trash } from "lucide-react";
import { toast } from "sonner";
import { siGithub, siGoogle } from "simple-icons";
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
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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

  const handleAddEmail = async () => {
    if (!newEmail) return;

    try {
      setIsSubmittingEmail(true);
      const emailAddress = await user?.createEmailAddress({
        email: newEmail,
      });

      // Prepare verification
      await emailAddress?.prepareVerification({
        strategy: "email_code",
      });

      setNewEmail("");
      setIsAddingEmail(false);
      toast.success("Verification email sent - please check your inbox");
    } catch (error) {
      console.error("Failed to add email:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add email address"
      );
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      await user?.delete();
      toast.success("Your account has been deleted");
      // The user will be automatically signed out and redirected by Clerk
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardContent className="space-y-4 pt-4">
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
                <div
                  key={email.id}
                  className="flex items-center justify-between"
                >
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
              {isAddingEmail ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="border-[#868d978e] dark:border-[#717d8d81] border-[1px] flex-grow"
                  />
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleAddEmail}
                    disabled={isSubmittingEmail || !newEmail}
                  >
                    {isSubmittingEmail ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAddingEmail(false);
                      setNewEmail("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={() => setIsAddingEmail(true)}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add email address
                </Button>
              )}
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="pt-4 border-t">
            <h3 className="mb-3 text-lg font-medium">Connected accounts</h3>
            <div className="space-y-3">
              {/* GitHub */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="currentColor"
                  >
                    <path d={siGithub.path} />
                  </svg>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUserProfile(true)}
                  >
                    Manage
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setShowUserProfile(true)}
                  >
                    Connect
                  </Button>
                )}
              </div>

              {/* Google */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="currentColor"
                  >
                    <path d={siGoogle.path} />
                  </svg>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUserProfile(true)}
                  >
                    Manage
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setShowUserProfile(true)}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t">
            <div className="rounded-lg border border-destructive/50 bg-destructive/20 p-6">
              <h3 className="text-2xl font-bold mb-2">Danger Zone</h3>
              <p className="text-sm mb-4">
                Permanently delete your account and all associated data.
              </p>
              <div className="space-y-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full sm:w-auto"
                      disabled={isDeletingAccount}
                    >
                      {isDeletingAccount ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash className="w-4 h-4 mr-2" />
                      )}
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove all your data from our
                        servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showUserProfile && (
        <div
          className="fixed inset-0 z-50 bg-background/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowUserProfile(false);
            }
          }}
        >
          <div className="fixed left-[50%] top-[50%] grid w-full max-w-[880px] translate-x-[-50%] translate-y-[-50%] bg-background shadow-lg duration-200 sm:rounded-lg overflow-y-auto">
            <div className="relative">
              <UserProfile routing="hash" />
              <Button
                className=" absolute opacity-70 bg-black-200 hover:bg-gray-600 hover:opacity-100 right-6 top-6 z-[50]"
                onClick={() => setShowUserProfile(false)}
              >
                <X className="w-5 h-5 stroke-white" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
