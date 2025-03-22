"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useSession } from "@/context/SessionContext";
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

export default function AnonymousDataMigration() {
  const { isSignedIn } = useUser();
  const { sessionId, clearSession } = useSession();
  const [hasAnonymousData, setHasAnonymousData] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if there's anonymous data when user signs in
  useEffect(() => {
    if (!isSignedIn || !sessionId) return;

    const checkAnonymousData = async () => {
      try {
        const response = await axios.get(
          `/api/check-anonymous-data?sessionId=${sessionId}`
        );

        if (response.data.hasData) {
          setHasAnonymousData(true);
          setIsDialogOpen(true);
        }
      } catch (error) {
        console.error("Error checking anonymous data:", error);
      }
    };

    checkAnonymousData();
  }, [isSignedIn, sessionId]);

  // Handle migration of anonymous data to the user's account
  const handleMigrateData = async () => {
    if (!isSignedIn || !sessionId) return;

    setIsLoading(true);
    try {
      const response = await axios.post("/api/migrate-anonymous-data", {
        sessionId,
      });

      if (response.data.success) {
        toast.success("Your data has been successfully migrated!");
        // Clear the anonymous session
        clearSession();
        // Close the dialog
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Error migrating data:", error);
      toast.error("Failed to migrate your data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setIsDialogOpen(false);
  };

  if (!hasAnonymousData || !isDialogOpen) {
    return null;
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Transfer Your Study Data</AlertDialogTitle>
          <AlertDialogDescription>
            We noticed you have modules and resources created while browsing
            anonymously. Would you like to transfer them to your account?
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
