"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Edit, Loader2, Trash } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ModuleForm } from "@/components/module-form";

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
    router.refresh();
  };

  // Handle module deletion
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await axios.delete(`/api/modules/${moduleId}`);
      toast.success("Module deleted");
      router.refresh();
    } catch (error) {
      console.error("Error deleting module:", error);
      toast.error("Failed to delete module");
    } finally {
      setIsDeleting(false);
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
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash className="h-4 w-4 text-destructive" />
        )}
      </Button>
    </div>
  );
}
