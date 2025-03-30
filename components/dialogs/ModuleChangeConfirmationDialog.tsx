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

interface ModuleChangeConfirmationDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  hasCurrentModule: boolean;
  onConfirm: () => void;
}

/**
 * A dialog for confirming changing a resource's module.
 *
 * @param isOpen - Whether the dialog is currently open
 * @param setIsOpen - Function to set the open state
 * @param hasCurrentModule - Whether the resource is currently in a module
 * @param onConfirm - Function to call when the change is confirmed
 */
export function ModuleChangeConfirmationDialog({
  isOpen,
  setIsOpen,
  hasCurrentModule,
  onConfirm,
}: ModuleChangeConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change module?</AlertDialogTitle>
          <AlertDialogDescription>
            This will move the resource to a different module.
            {hasCurrentModule &&
              " It will no longer appear in the current module."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
