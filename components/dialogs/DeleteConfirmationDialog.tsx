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
 * A dialog component that prompts the user to confirm the deletion of a resource.
 *
 * The dialog warns that the deletion is permanent and cannot be undone. It offers options to cancel or confirm the deletion.
 * When a deletion is in progress, the confirm button is disabled and displays "Deleting...".
 *
 * @param isOpen - Controls the visibility of the dialog.
 * @param setIsOpen - Callback to update the dialog's open state.
 * @param resourceTitle - The title of the resource to be deleted, displayed in the confirmation message.
 * @param onDelete - Handler invoked when the deletion is confirmed.
 * @param isDeleting - Indicates whether the deletion operation is currently in progress.
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
