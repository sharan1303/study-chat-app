"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Edit, Loader2, Trash } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ModuleForm } from "@/components/module-form";
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

interface ModuleActionsProps {
  moduleId: string;
  moduleName: string;
}

export default function ModuleActions({
  moduleId,
  moduleName,
}: ModuleActionsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [moduleDetails, setModuleDetails] = useState<{
    id: string;
    name: string;
    description?: string;
    icon: string;
  } | null>(null);

  // Fetch module details for editing
  const handleEdit = async () => {
    try {
      const response = await axios.get(`/api/modules/${moduleId}`);
      setModuleDetails({
        id: response.data.id,
        name: response.data.name,
        description: response.data.description || undefined,
        icon: response.data.icon,
      });
      setIsEditing(true);
    } catch (error) {
      console.error("Error fetching module details:", error);
      toast.error("Failed to load module details");
    }
  };

  // Handle successful edit
  const handleEditSuccess = () => {
    setIsEditing(false);
    setModuleDetails(null);
    toast.success("Module updated");

    // Use router.refresh() for less disruption
    // If the edit involved a name change, the ModuleForm component will handle that separately
    router.refresh();
  };

  // Handle module deletion
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await axios.delete(`/api/modules/${moduleId}`);
      toast.success(`Module "${moduleName}" deleted successfully`);

      // Use setTimeout to ensure toast is visible before redirect
      setTimeout(() => {
        // Force a full navigation to ensure all components refresh
        window.location.href = "/modules";
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
    <div className="flex space-x-1">
      <Dialog
        open={isEditing}
        onOpenChange={(open) => !open && setIsEditing(false)}
      >
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" onClick={handleEdit}>
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        {moduleDetails && (
          <DialogContent className="sm:max-w-[600px]">
            <ModuleForm
              initialData={moduleDetails}
              onSuccess={handleEditSuccess}
            />
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Module Alert Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowDeleteAlert(true)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash className="h-4 w-4 text-destructive" />
          )}
        </Button>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete module "{moduleName}" and all its
              resources. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
