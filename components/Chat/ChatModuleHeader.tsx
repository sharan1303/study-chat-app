"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ModuleWithResources } from "@/lib/actions";

interface ChatModuleHeaderProps {
  moduleDetails: ModuleWithResources;
  navigateToModuleDetails: () => void;
}

export default function ChatModuleHeader({
  moduleDetails,
  navigateToModuleDetails,
}: ChatModuleHeaderProps) {
  if (!moduleDetails) return null;

  // Safely extract values with fallbacks
  const moduleName = moduleDetails.name || "Unnamed Module";
  const moduleIcon = moduleDetails.icon || "📚";

  return (
    <div className="py-3.5 pl-8 flex add-margin-for-headers top-1 bg-background">
      <Button
        variant="ghost"
        className="flex items-center gap-4 hover:bg-muted/50 rounded flex-shrink max-w-full"
        onClick={navigateToModuleDetails}
      >
        <span className="text-2xl flex-shrink-0">{moduleIcon}</span>
        <div className="min-w-0 overflow-hidden">
          <h1 className="text-xl font-medium truncate">{moduleName}</h1>
        </div>
      </Button>
    </div>
  );
}
