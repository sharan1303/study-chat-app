import { useState, useRef, useCallback, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Module } from "../module-detail-page";

interface ModuleContextEditorProps {
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

export default function ModuleContextEditor({
  module,
  updateModule,
}: ModuleContextEditorProps) {
  const [isEditingContext, setIsEditingContext] = useState(false);
  const [editContext, setEditContext] = useState(module.context || "");
  const [isSaving, setIsSaving] = useState(false);
  const contextEditRef = useRef<HTMLDivElement>(null);

  // Initialize content when module data changes
  useEffect(() => {
    setEditContext(module.context || "");
  }, [module]);

  // Handle content update
  const handleContextSave = async () => {
    setIsSaving(true);
    await updateModule({ context: editContext });
    setIsSaving(false);
    setIsEditingContext(false);
  };

  // Cancel editing
  const cancelContextEdit = useCallback(() => {
    setEditContext(module?.context || "");
    setIsEditingContext(false);
  }, [module]);

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isEditingContext &&
        contextEditRef.current &&
        !contextEditRef.current.contains(event.target as Node)
      ) {
        cancelContextEdit();
      }
    }

    // Add event listener when editing is active
    if (isEditingContext) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditingContext, cancelContextEdit]);

  return (
    <>
      {isEditingContext ? (
        <div className="flex flex-col gap-2" ref={contextEditRef}>
          <Textarea
            value={editContext}
            onChange={(e) => setEditContext(e.target.value)}
            className="min-h-[158px] mr-6 p-4"
            placeholder="Enter your context here..."
            tabIndex={0}
            autoFocus
            onKeyDown={(e) => {
              // Save on Ctrl+Enter or Command+Enter
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleContextSave();
              }
              // Cancel on Escape
              if (e.key === "Escape") {
                e.preventDefault();
                cancelContextEdit();
              }
            }}
          />
          <div className="flex justify-end gap-2 -mb-4">
            <Button variant="outline" size="sm" onClick={cancelContextEdit}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleContextSave} disabled={isSaving}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p
          className="text-muted-foreground cursor-pointer hover:bg-muted/50 p-4 mr-4 mb-12 rounded min-h-[158px]"
          onClick={() => setIsEditingContext(true)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setIsEditingContext(true);
            }
          }}
        >
          {module.context || "Enter your context here..."}
        </p>
      )}
    </>
  );
}
