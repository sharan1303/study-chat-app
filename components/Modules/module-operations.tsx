"use client";

import { useState, useRef } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { ModuleForm } from "@/components/dialogs/ModuleForm";
import { ShortcutIndicator } from "@/components/ui/shortcut-indicator";
import { SHORTCUTS } from "@/components/Sidebar/ClientSidebar";

interface ModuleOperationsProps {
  showLarge?: boolean;
  sessionId?: string | null;
}

export default function ModuleOperations({
  showLarge = false,
  sessionId,
}: ModuleOperationsProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [showShortcut, setShowShortcut] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCreateSuccess = () => {
    setIsCreating(false);
    // The actual navigation will be handled in the form component
  };

  const handleMouseEnter = () => {
    // Set a timeout to show the shortcut after a small delay
    timerRef.current = setTimeout(() => {
      setShowShortcut(true);
    }, 400);
  };

  const handleMouseLeave = () => {
    // Clear the timeout if it hasn't fired yet
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // Hide the shortcut immediately
    setShowShortcut(false);
  };

  return (
    <Dialog open={isCreating} onOpenChange={setIsCreating}>
      <DialogTrigger asChild>
        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {showLarge ? (
            <Button size="lg" variant="outline" className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Create Module</span>
            </Button>
          ) : (
            <Button variant="outline" className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Create Module</span>
            </Button>
          )}
          {showShortcut && (
            <div className="absolute top-1/2 -translate-y-1/2 left-full ml-2 z-50 bg-card p-1.5 rounded-md shadow-md">
              <ShortcutIndicator shortcutKey={SHORTCUTS.NEW_MODULE} />
            </div>
          )}
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Create Module</DialogTitle>
        <ModuleForm onSuccess={handleCreateSuccess} sessionId={sessionId} />
      </DialogContent>
    </Dialog>
  );
}
