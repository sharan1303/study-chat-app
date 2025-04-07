"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useSession } from "@/context/session-context";
import axios from "axios";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

// Key for tracking dialog dismissal in localStorage
const MIGRATION_SKIPPED_KEY = "data_migration_skipped";

export default function AnonymousDataMigration() {
  const { isSignedIn } = useUser();
  const { sessionId, clearSession } = useSession();
  const [hasAnonymousData, setHasAnonymousData] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if there's anonymous data when user signs in
  useEffect(() => {
    if (!isSignedIn || !sessionId) return;

    // Check if user has already skipped the migration dialog
    if (
      typeof window !== "undefined" &&
      localStorage.getItem(`${MIGRATION_SKIPPED_KEY}_${sessionId}`)
    ) {
      return;
    }

    const checkAnonymousData = async () => {
      try {
        console.log(
          `Checking anonymous data for sessionId: ${sessionId.substring(
            0,
            8
          )}...`
        );
        const response = await axios.get(
          `/api/check-anonymous-data?sessionId=${sessionId}`,
          {
            validateStatus: function (status) {
              // Consider 401 as a valid response - it means the user is not authenticated yet
              return (status >= 200 && status < 300) || status === 401;
            },
          }
        );

        // If we got a 401 but we have a session ID, the user isn't authenticated yet,
        // which is expected when a user has just signed in but the session is still anonymous
        if (response.status === 401) {
          console.log(
            "Received 401 from check-anonymous-data - user not authenticated yet"
          );
          return;
        }

        if (response.data.hasData) {
          console.log(
            `Found anonymous data: ${JSON.stringify(response.data.counts)}`
          );
          setHasAnonymousData(true);
          setIsDialogOpen(true);
        } else {
          console.log("No anonymous data found to migrate");
        }
      } catch (error) {
        console.error("Error checking anonymous data:", error);
        // Add more detailed error logging with specific error info
        if (axios.isAxiosError(error)) {
          console.error(
            `Status: ${error.response?.status}, Message: ${
              error.response?.data?.error || error.message
            }`
          );

          // Don't show error toast for authentication issues which are expected for new users
          if (error.response?.status !== 401) {
            toast.error(
              "Failed to check for previous data. Please refresh the page."
            );
          }
        }
      }
    };

    checkAnonymousData();
  }, [isSignedIn, sessionId]);

  // Handle migration of anonymous data to the user's account
  const handleMigrateData = async () => {
    if (!isSignedIn || !sessionId) return;

    setIsLoading(true);
    try {
      console.log(
        `Migrating anonymous data for sessionId: ${sessionId.substring(
          0,
          8
        )}...`
      );

      // Get the current user ID
      const { userId } = await fetch("/api/user").then((res) => res.json());

      if (!userId) {
        console.error("Migration failed: couldn't get current user ID");
        toast.error("Failed to migrate your data. Please try again.");
        setIsLoading(false);
        return;
      }

      console.log(`Got userId for migration: ${userId.substring(0, 8)}...`);

      const response = await axios.post("/api/migrate-anonymous-data", {
        sessionId,
        userId,
      });

      if (response.data.success) {
        console.log(
          `Migration successful: ${JSON.stringify(response.data.migrated)}`
        );
        toast.success(
          "Your chats have been successfully migrated to your account!"
        );
        // Clear the anonymous session
        clearSession();
        // Close the dialog
        setIsDialogOpen(false);
        // Mark as handled in localStorage to prevent future prompts
        if (typeof window !== "undefined") {
          localStorage.setItem(`${MIGRATION_SKIPPED_KEY}_${sessionId}`, "true");
        }
      }
    } catch (error) {
      console.error("Error migrating data:", error);

      // Log more details for axios errors
      if (axios.isAxiosError(error)) {
        console.error(
          `Migration error - Status: ${error.response?.status}, Message: ${
            error.response?.data?.error || error.message
          }`
        );
      }

      toast.error("Failed to migrate your data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setIsDialogOpen(false);
    // Mark as skipped in localStorage to prevent showing again on refresh
    if (typeof window !== "undefined" && sessionId) {
      localStorage.setItem(`${MIGRATION_SKIPPED_KEY}_${sessionId}`, "true");
    }
  };

  if (!hasAnonymousData || !isDialogOpen) {
    return null;
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Transfer Your Data</AlertDialogTitle>
          <AlertDialogDescription>
            We noticed you have been browsing anonymously. Would you like to
            transfer your data to your account?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleSkip}>Skip</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleMigrateData}
            disabled={isLoading}
            className="bg-primary text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Transferring...
              </>
            ) : (
              "Transfer Data"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
