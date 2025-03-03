"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

// Loading component for Suspense fallback
function ChatRedirectLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to chat...</p>
      </div>
    </div>
  );
}

// Redirect component that uses hooks
function ChatRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleParam = searchParams.get("module");

  useEffect(() => {
    // Redirect to home page with the module parameter if it exists
    if (moduleParam) {
      router.replace(`/?module=${moduleParam}`);
    } else {
      router.replace("/");
    }
  }, [router, moduleParam]);

  return null;
}

// Export the page component with Suspense
export default function ChatPage() {
  return (
    <Suspense fallback={<ChatRedirectLoading />}>
      <ChatRedirect />
    </Suspense>
  );
}
