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
  const { user, isSignedIn } = useUser();
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

  const handleMigrateData = async () => {
    if (!user || !sessionId) return;

    setIsLoading(true);
    try {
      const response = await axios.post("/api/migrate-anonymous-data", {
        sessionId: sessionId,
      });

      if (response.data.success) {
        const { modules, resources } = response.data.migrated;
        toast.success(
          `Migration complete! Moved ${modules} modules and ${resources} resources to your account.`
        );

        // Clear the session after successful migration
        clearSession();

        // Refresh the page to show the migrated data
        window.location.reload();
      }
    } catch (error) {
      console.error("Error migrating data:", error);
      toast.error("Failed to migrate data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsDialogOpen(false);
    }
  };

  const handleDismiss = () => {
    setIsDialogOpen(false);
  };

  // Don't render anything if there's no anonymous data
  if (!hasAnonymousData) {
    return null;
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Anonymous Data Found</AlertDialogTitle>
          <AlertDialogDescription>
            We&apos;ve detected data from your previous anonymous session. Would
            you like to move this data to your account?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDismiss}>
            No, keep separate
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleMigrateData}
            disabled={isLoading}
            className="bg-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Migrating...
              </>
            ) : (
              "Yes, migrate my data"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
