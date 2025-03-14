import { useState, useEffect } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ResourceUploadDialog } from "@/components/dialogs/ResourceUploadDialog";

interface ResourceUploadButtonProps extends ButtonProps {
  moduleId?: string;
  children?: React.ReactNode;
  initialOpen?: boolean;
}

export function ResourceUploadButton({
  moduleId,
  children,
  initialOpen = false,
  ...props
}: ResourceUploadButtonProps) {
  const [open, setOpen] = useState(initialOpen);

  useEffect(() => {
    if (initialOpen) {
      setOpen(true);
    }
  }, [initialOpen]);

  return (
    <>
      <Button onClick={() => setOpen(true)} {...props}>
        {children || (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Upload Resource
          </>
        )}
      </Button>
      <ResourceUploadDialog
        open={open}
        onOpenChange={setOpen}
        preselectedModuleId={moduleId}
      />
    </>
  );
}
