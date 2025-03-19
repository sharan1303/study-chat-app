import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/nextjs";

interface LoginRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

export function LoginRequiredDialog({
  open,
  onOpenChange,
  featureName = "this feature",
}: LoginRequiredDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Account required</DialogTitle>
          <DialogDescription>
            You need to sign in to use {featureName}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4 py-4">
          <p className="text-center text-sm text-muted-foreground">
            Create an account or sign in to upload resources, save your
            progress, and access all features.
          </p>
          <SignInButton mode="modal">
            <Button>Sign in</Button>
          </SignInButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
