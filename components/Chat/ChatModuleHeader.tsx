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

  return (
    <div className="py-3 pl-5 flex add-margin-for-headers top-1 bg-background">
      <Button
        variant="ghost"
        className="flex items-center gap-3 pt-4 hover:bg-muted/50 rounded flex-shrink max-w-[85%]"
        onClick={navigateToModuleDetails}
      >
        <span className="text-2xl flex-shrink-0">{moduleDetails.icon}</span>
        <div className="min-w-0 overflow-hidden">
          <h1 className="text-xl truncate">{moduleDetails.name}</h1>
        </div>
      </Button>
    </div>
  );
}
