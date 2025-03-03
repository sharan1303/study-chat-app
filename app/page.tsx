"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ModulesDialog } from "@/components/modules-dialog";

// Note: Metadata must be in a separate file or a server component
// since this is now a client component

export default function Home() {
  const router = useRouter();
  const [showModulesDialog, setShowModulesDialog] = useState(false);

  useEffect(() => {
    // Check if this is the first visit
    const hasVisited = localStorage.getItem("hasVisitedBefore");

    if (!hasVisited) {
      // First visit - show the modules dialog
      setShowModulesDialog(true);
      localStorage.setItem("hasVisitedBefore", "true");
    } else {
      // Not first visit - redirect to chat
      router.push("/chat");
    }
  }, [router]);

  const handleModuleSelect = (moduleId: string) => {
    setShowModulesDialog(false);
    router.push(`/chat?module=${moduleId}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <ModulesDialog
        open={showModulesDialog}
        onOpenChange={(open) => {
          setShowModulesDialog(open);
          if (!open) {
            router.push("/chat");
          }
        }}
        onModuleSelect={handleModuleSelect}
      />
    </div>
  );
}
