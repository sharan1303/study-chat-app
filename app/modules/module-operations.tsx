"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ModuleForm } from "@/components/module-form";

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
          <Button size="lg" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create Module
          </Button>
        ) : (
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create Module
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <ModuleForm onSuccess={handleCreateSuccess} sessionId={sessionId} />
      </DialogContent>
    </Dialog>
  );
}
