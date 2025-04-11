"use client";

import { useState, useEffect } from "react";
import { ResourceUploadDialog } from "@/components/dialogs/ResourceUploadDialog";

// Event name that was defined in command-k.tsx
const OPEN_RESOURCE_UPLOAD_DIALOG_EVENT = "open-resource-upload-dialog";

export function GlobalResourceUploadDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Function to handle the custom event
    const handleOpenDialog = () => {
      setOpen(true);
    };

    // Add event listener
    document.addEventListener(
      OPEN_RESOURCE_UPLOAD_DIALOG_EVENT,
      handleOpenDialog
    );

    // Clean up event listener
    return () => {
      document.removeEventListener(
        OPEN_RESOURCE_UPLOAD_DIALOG_EVENT,
        handleOpenDialog
      );
    };
  }, []);

  return <ResourceUploadDialog open={open} onOpenChange={setOpen} />;
}
