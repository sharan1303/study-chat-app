"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ModuleForm } from "@/components/module-form";

interface ModuleOperationsProps {
  showLarge?: boolean;
}

export default function ModuleOperations({
  showLarge = false,
}: ModuleOperationsProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSuccess = () => {
    setIsCreating(false);
    router.refresh();
  };

  return (
    <Dialog open={isCreating} onOpenChange={setIsCreating}>
      <DialogTrigger asChild>
        {showLarge ? (
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Create Module
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Module
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <ModuleForm onSuccess={handleCreateSuccess} />
      </DialogContent>
    </Dialog>
  );
}
