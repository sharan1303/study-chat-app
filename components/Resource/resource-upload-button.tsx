import { useState, useEffect, useRef } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { ResourceUploadDialog } from "@/components/dialogs/ResourceUploadDialog";
import { LoginRequiredDialog } from "@/components/dialogs/LoginRequiredDialog";
import { useUser } from "@clerk/nextjs";
import { ShortcutIndicator } from "@/components/ui/shortcut-indicator";
import { SHORTCUTS } from "@/components/Sidebar/ClientSidebar";

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
  const [showShortcut, setShowShortcut] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
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

  const handleMouseEnter = () => {
    // Set a timeout to show the shortcut after a small delay
    timerRef.current = setTimeout(() => {
      setShowShortcut(true);
    }, 400);
  };

  const handleMouseLeave = () => {
    // Clear the timeout if it hasn't fired yet
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // Hide the shortcut immediately
    setShowShortcut(false);
  };

  return (
    <>
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Button onClick={handleButtonClick} {...props}>
          {children || (
            <>
              <Upload className="h-4 w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Upload</span>
            </>
          )}
        </Button>
        {showShortcut && (
          <div className="absolute top-1/2 -translate-y-1/2 left-full ml-2 z-50 bg-card p-1.5 rounded-md shadow-md">
            <ShortcutIndicator shortcutKey={SHORTCUTS.UPLOAD_RESOURCE} />
          </div>
        )}
      </div>

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
