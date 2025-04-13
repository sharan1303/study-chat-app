import { useState, useRef, useCallback, useEffect } from "react";
import { Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Module } from "../module-detail-page";

interface ModuleTitleProps {
  module: Module;
  updateModule: (updates: {
    name?: string | undefined;
    context?: string | undefined;
    icon?: string | undefined;
  }) => Promise<
    | {
        success: boolean;
        requiresRefresh?: boolean;
        formattedName?: string;
      }
    | undefined
  >;
}

export default function ModuleTitle({
  module,
  updateModule,
}: ModuleTitleProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(module.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const titleEditRef = useRef<HTMLDivElement>(null);

  // Initialize title when module data changes
  useEffect(() => {
    setEditTitle(module.name || "");
  }, [module]);

  // Handle title update
  const handleTitleSave = async () => {
    if (editTitle.trim().length < 2) {
      toast.error("Title must be at least 2 characters");
      return;
    }

    setIsSaving(true);
    const result = await updateModule({ name: editTitle });
    setIsSaving(false);
    setIsEditingTitle(false);

    // Handle page navigation if name changed
    if (result?.success && result.requiresRefresh && result.formattedName) {
      setTimeout(() => {
        window.location.href = `/modules/${result.formattedName}`;
      }, 600);
    }
  };

  // Cancel editing
  const cancelTitleEdit = useCallback(() => {
    setEditTitle(module?.name || "");
    setIsEditingTitle(false);
  }, [module]);

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isEditingTitle &&
        titleEditRef.current &&
        !titleEditRef.current.contains(event.target as Node)
      ) {
        cancelTitleEdit();
      }
    }

    // Add event listener when editing is active
    if (isEditingTitle) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditingTitle, cancelTitleEdit]);

  return (
    <>
      {isEditingTitle ? (
        <div className="flex items-center flex-shrink" ref={titleEditRef}>
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="min-w-0"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleTitleSave();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                cancelTitleEdit();
              }
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleTitleSave}
            disabled={isSaving}
          >
            <Check className="h-5 w-5 text-green-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={cancelTitleEdit}>
            <X className="h-5 w-5 text-red-500" />
          </Button>
        </div>
      ) : (
        <h1
          className="text-xl cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
          onClick={() => setIsEditingTitle(true)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setIsEditingTitle(true);
            }
          }}
        >
          <span className="flex-shrink">{module.name}</span>
        </h1>
      )}
    </>
  );
}
