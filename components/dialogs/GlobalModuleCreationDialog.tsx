"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ModuleForm } from "@/components/dialogs/ModuleForm";
import { useKeyboardShortcuts } from "@/context/keyboard-shortcuts-context";

/**
 * GlobalModuleDialog component
 *
 * This component provides a global dialog for creating new modules
 * that can be triggered via the Cmd/Ctrl + J keyboard shortcut
 */
export function GlobalModuleDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

  // Register keyboard shortcut
  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      e.preventDefault();
      setIsOpen(true);
    };

    // Register the shortcut (Cmd/Ctrl + J)
    registerShortcut("cmd+j", handleKeyboardShortcut);

    // Cleanup on unmount
    return () => {
      unregisterShortcut("cmd+j");
    };
  }, [registerShortcut, unregisterShortcut]);

  const handleSuccess = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogTitle className="text-xl font-bold ml-4">
          Create New Module
        </DialogTitle>
        <ModuleForm
          onSuccess={handleSuccess}
          successEventName="module-create-success"
        />
      </DialogContent>
    </Dialog>
  );
}
