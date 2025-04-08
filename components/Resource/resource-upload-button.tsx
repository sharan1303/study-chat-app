import { useState, useEffect } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { ResourceUploadDialog } from "@/components/dialogs/ResourceUploadDialog";
import { LoginRequiredDialog } from "@/components/dialogs/LoginRequiredDialog";
import { useUser } from "@clerk/nextjs";

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
  const [openUpload, setOpenUpload] = useState(initialOpen);
  const [openLoginRequired, setOpenLoginRequired] = useState(false);
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (initialOpen) {
      if (isSignedIn) {
        setOpenUpload(true);
      } else {
        setOpenLoginRequired(true);
      }
    }
  }, [initialOpen, isSignedIn]);

  const handleButtonClick = () => {
    if (isSignedIn) {
      setOpenUpload(true);
    } else {
      setOpenLoginRequired(true);
    }
  };

  return (
    <>
      <Button onClick={handleButtonClick} {...props}>
        {children || (
          <>
            <Upload className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Upload</span>
          </>
        )}
      </Button>

      {/* Show resource upload dialog for authenticated users */}
      <ResourceUploadDialog
        open={!!(openUpload && isSignedIn)}
        onOpenChange={setOpenUpload}
        preselectedModuleId={moduleId}
      />

      {/* Show login required dialog for unauthenticated users */}
      <LoginRequiredDialog
        open={openLoginRequired}
        onOpenChange={setOpenLoginRequired}
        featureName="resource uploads"
      />
    </>
  );
}
