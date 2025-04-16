"use client";

import { useState } from "react";
import { ExternalLink, Trash } from "lucide-react";
import { toast } from "sonner";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
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

interface ChatContextMenuProps {
  chatId: string;
  chatName: string;
  chatPath: string;
  children: React.ReactNode;
  triggerClassName?: string;
  onDelete?: () => void;
  disabled?: boolean;
}

export function ChatContextMenu({
  chatId,
  chatName,
  chatPath,
  children,
  triggerClassName,
  onDelete,
  disabled = false,
}: ChatContextMenuProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenInNewTab = () => {
    window.open(chatPath, "_blank");
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      // Here you would call your API to delete the chat thread
      // For example: await api.deleteChat(chatId);

      toast.success(`Chat "${chatName}" deleted successfully`);

      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  return (
    <>
      {disabled ? (
        <>{children}</>
      ) : (
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
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => setShowDeleteAlert(true)}
              className="cursor-pointer text-destructive focus:text-destructive text-xs"
            >
              <Trash className="mr-2 h-4 w-4" /> Delete thread
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )}

      {/* Delete Chat Alert Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Delete Chat
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat thread? This action
              cannot be undone.
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
