"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

// Note: Metadata must be in a separate file or a server component
// since this is now a client component

export default function Home() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    // Check if user is signed in
    if (isSignedIn) {
      // Check if this is the first visit
      const hasVisited = localStorage.getItem("hasVisitedBefore");

      if (!hasVisited) {
        // First visit - redirect to modules page
        router.push("/modules");
        localStorage.setItem("hasVisitedBefore", "true");
      } else {
        // Not first visit - redirect to chat
        router.push("/chat");
      }
    } else {
      // Not signed in - redirect to sign-in page
      router.push("/sign-in");
    }
  }, [router, isLoaded, isSignedIn]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      {/* Loading state while redirecting */}
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
