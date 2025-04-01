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

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  resourceTitle: string;
  onDelete: () => void;
  isDeleting: boolean;
}

/**
 * A dialog for confirming resource deletion.
 *
 * @param isOpen - Whether the dialog is currently open
 * @param setIsOpen - Function to set the open state
 * @param resourceTitle - The title of the resource being deleted
 * @param onDelete - Function to call when deletion is confirmed
 * @param isDeleting - Whether the deletion is in progress
 */
export function DeleteConfirmationDialog({
  isOpen,
  setIsOpen,
  resourceTitle,
  onDelete,
  isDeleting,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &quot;{resourceTitle}&quot; and cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
