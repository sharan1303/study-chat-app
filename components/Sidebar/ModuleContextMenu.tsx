"use client";

import { useState } from "react";
import { ExternalLink, Edit, Trash, MessageSquare } from "lucide-react";
import { encodeModuleSlug } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ModuleForm } from "@/components/dialogs/ModuleForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ModuleContextMenuProps {
  module: {
    id: string;
    name: string;
    context?: string | null;
    icon: string;
  };
  children: React.ReactNode;
  triggerClassName?: string;
}

export function ModuleContextMenu({
  module,
  children,
  triggerClassName,
}: ModuleContextMenuProps) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenInNewTab = () => {
    const encodedName = encodeModuleSlug(module.name);
    window.open(`/modules/${encodedName}`, "_blank");
  };

  const handleGoToChat = () => {
    const encodedName = encodeModuleSlug(module.name);
    router.push(`/${encodedName}/chat`);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
  };

  // Handle module deletion
  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      // Check for anonymous sessionId
      const sessionId = localStorage.getItem("anonymous_session_id");

      let apiUrl = `/api/modules/${module.id}`;
      if (sessionId) {
        apiUrl = `/api/modules/${module.id}?sessionId=${sessionId}`;
      }

      await axios.delete(apiUrl);
      toast.success(`Module "${module.name}" deleted successfully`);

      // Use setTimeout to ensure toast is visible before redirect
      setTimeout(() => {
        router.push("/modules");
      }, 600);
    } catch (error) {
      console.error("Error deleting module:", error);
      toast.error("Failed to delete module");
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild className={triggerClassName}>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            onClick={handleOpenInNewTab}
            className="cursor-pointer text-xs"
          >
            <ExternalLink className="mr-2 h-4 w-4" /> Open in new tab
          </ContextMenuItem>
          <ContextMenuItem
            onClick={handleGoToChat}
            className="cursor-pointer text-xs"
          >
            <MessageSquare className="mr-2 h-4 w-4" /> New module chat
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => setIsEditDialogOpen(true)}
            className="cursor-pointer text-xs"
          >
            <Edit className="mr-2 h-4 w-4" /> Edit module
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => setShowDeleteAlert(true)}
            className="cursor-pointer text-destructive focus:text-destructive text-xs"
          >
            <Trash className="mr-2 h-4 w-4" /> Delete module
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Edit Module Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogTitle className="text-xl font-bold ml-4">
            Edit Module
          </DialogTitle>
          <ModuleForm
            initialData={{
              id: module.id,
              name: module.name,
              context: module.context || "",
              icon: module.icon,
            }}
            successEventName="module.updated"
            onSuccess={handleEditSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Module Alert Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogTitle className="text-destructive">
            Delete Module
          </AlertDialogTitle>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete module &quot;{module.name}&quot; and
              all its resources. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
