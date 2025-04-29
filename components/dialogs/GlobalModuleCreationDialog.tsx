"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ModuleForm } from "@/components/dialogs/ModuleForm";
import { useKeyboardShortcuts } from "@/context/keyboard-shortcuts-context";

// Custom event name for opening the module dialog - must match the one in command-k.tsx
const OPEN_MODULE_DIALOG_EVENT = "open-module-dialog";
// Event for module creation
const MODULE_CREATED_EVENT = "module.created";

/**
 * GlobalModuleDialog component
 *
 * This component provides a global dialog for creating new modules
 * that can be triggered via the Cmd/Ctrl + J keyboard shortcut
 * or via the Command+K menu
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

  // Listen for custom event to open the dialog from command-k
  useEffect(() => {
    const handleOpenDialog = () => {
      setIsOpen(true);
    };

    document.addEventListener(OPEN_MODULE_DIALOG_EVENT, handleOpenDialog);
    return () => {
      document.removeEventListener(OPEN_MODULE_DIALOG_EVENT, handleOpenDialog);
    };
  }, []);

  // Listen for module created event to close the dialog
  useEffect(() => {
    const handleModuleCreated = () => {
      setIsOpen(false);
    };

    window.addEventListener(MODULE_CREATED_EVENT, handleModuleCreated);
    return () => {
      window.removeEventListener(MODULE_CREATED_EVENT, handleModuleCreated);
    };
  }, []);

  const handleSuccess = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogTitle className="text-xl font-normal ml-4">
          Create New Module
        </DialogTitle>
        <ModuleForm
          onSuccess={handleSuccess}
          successEventName={MODULE_CREATED_EVENT}
        />
      </DialogContent>
    </Dialog>
  );
}
