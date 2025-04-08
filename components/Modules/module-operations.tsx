"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { ModuleForm } from "@/components/dialogs/ModuleForm";

interface ModuleOperationsProps {
  showLarge?: boolean;
  sessionId?: string | null;
}

export default function ModuleOperations({
  showLarge = false,
  sessionId,
}: ModuleOperationsProps) {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSuccess = () => {
    setIsCreating(false);
    // The actual navigation will be handled in the form component
  };

  return (
    <Dialog open={isCreating} onOpenChange={setIsCreating}>
      <DialogTrigger asChild>
        {showLarge ? (
          <Button size="lg" variant="outline" className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Create Module</span>
          </Button>
        ) : (
          <Button variant="outline" className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Create Module</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Create Module</DialogTitle>
        <ModuleForm onSuccess={handleCreateSuccess} sessionId={sessionId} />
      </DialogContent>
    </Dialog>
  );
}
