"use client";

import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FileSearch } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Toggle component for enabling/disabling RAG functionality in the chat
 *
 * @param isEnabled Current state of RAG functionality
 * @param onChange Callback when the toggle changes
 * @returns The RAG toggle UI component
 */
export function RAGToggle({
  isEnabled,
  onChange,
}: {
  isEnabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center">
        <Switch id="rag-mode" checked={isEnabled} onCheckedChange={onChange} />
        <div className="ml-2 flex items-center">
          <FileSearch className="h-4 w-4 mr-1" />
          <Label htmlFor="rag-mode" className="text-sm">
            Document Search
          </Label>
        </div>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="ml-1 cursor-help text-muted-foreground">
              <span className="sr-only">Help</span>
              <span className="h-4 w-4 rounded-full border border-muted-foreground/50 flex items-center justify-center text-xs">
                ?
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="max-w-xs">
              Enable document search to let the AI use your uploaded resources
              to answer questions
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
