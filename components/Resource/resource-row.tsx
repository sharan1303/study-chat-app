"use client";

import { useState, useRef, useEffect, memo } from "react";
import {
  Edit,
  Trash,
  FileIcon,
  FileText,
  Image,
  File,
  FileAudio,
  FileVideo,
  FileArchive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";
import { useResourceUrl } from "@/lib/hooks/useResourceUrl";
import { DeleteConfirmationDialog } from "@/components/dialogs/ResourceDeleteConfirmationDialog";
import {
  getFileTypeFromExtension,
  getFileTypeFromMimeType,
} from "@/lib/fileTypes";

interface Resource {
  id: string;
  title: string;
  type: string;
  fileUrl: string | null;
  moduleId: string;
  moduleName?: string | null;
  createdAt: string;
  updatedAt?: string;
  _deleted?: boolean;
  fileSize?: number;
  userId?: string | null;
}

interface Module {
  id: string;
  name: string;
  icon: string;
}

// Function to format file size
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "—";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

// Function to get icon based on file type
const getFileIcon = (type: string): React.ReactElement => {
  if (!type) return <File size={18} />;

  // If type includes a slash (e.g., image/jpeg), extract the primary type
  const primaryType = type.includes("/")
    ? type.split("/")[0].toLowerCase()
    : type.toLowerCase();

  if (primaryType === "application" && type.includes("pdf"))
    return <FileText size={18} />;
  if (primaryType === "image")
    return <Image size={18} aria-label="Image file" />;
  if (primaryType === "video") return <FileVideo size={18} />;
  if (primaryType === "audio") return <FileAudio size={18} />;
  if (
    primaryType === "text" ||
    primaryType === "document" ||
    (primaryType === "application" &&
      (type.includes("document") ||
        type.includes("msword") ||
        type.includes("wordprocessing") ||
        type.includes("text") ||
        type.includes("rtf")))
  )
    return <FileText size={18} />;
  if (
    primaryType === "code" ||
    type.includes("javascript") ||
    type.includes("json") ||
    type.includes("html") ||
    type.includes("css")
  )
    return <FileText size={18} />;
  if (
    primaryType.includes("zip") ||
    primaryType.includes("archive") ||
    primaryType === "archive" ||
    (primaryType === "application" &&
      (type.includes("zip") ||
        type.includes("rar") ||
        type.includes("tar") ||
        type.includes("gzip") ||
        type.includes("compress")))
  )
    return <FileArchive size={18} />;

  return <FileIcon size={18} />;
};

// Function to extract file extension from URL or title
const getFileExtension = (resource: Resource): string => {
  // If the type already includes an extension (e.g., "image/jpg"), use that
  if (resource.type && resource.type.includes("/")) {
    return resource.type.split("/")[1];
  }

  // Try to extract from fileUrl
  if (resource.fileUrl) {
    // Remove query parameters
    const urlWithoutParams = resource.fileUrl.split("?")[0];
    // Get the filename
    const fileName = urlWithoutParams.split("/").pop() || "";
    // Extract extension
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext && ext.length > 0 && ext.length < 5) {
      return ext;
    }
  }

  // Try to extract from title if no extension found in URL
  const titleParts = resource.title.split(".");
  if (titleParts.length > 1) {
    const ext = titleParts.pop()?.toLowerCase();
    if (ext && ext.length > 0 && ext.length < 5) {
      return ext;
    }
  }

  // If no extension found, return the generic type
  return resource.type;
};

// Function to get a more descriptive file type display
const getDetailedFileType = (resource: Resource): string => {
  // If type already has the format "type/extension", use a more readable format
  if (resource.type && resource.type.includes("/")) {
    return getFileTypeFromMimeType(resource.type);
  }

  const ext = getFileExtension(resource);
  return (
    getFileTypeFromExtension(ext) ||
    resource.type.charAt(0).toUpperCase() + resource.type.slice(1)
  );
};

// Module selector component
const ModuleSelector = ({
  selectedModuleId,
  setSelectedModuleId,
  modules,
}: {
  selectedModuleId: string;
  setSelectedModuleId: (id: string) => void;
  modules: Module[];
}) => (
  <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
    <SelectTrigger className="w-full max-w-[160px] h-8 text-xs">
      <SelectValue placeholder="Select a module" />
    </SelectTrigger>
    <SelectContent className="w-auto max-w-[180px] z-50">
      {modules.map((module) => (
        <SelectItem key={module.id} value={module.id}>
          <span className="flex items-center gap-2 text-xs">
            <span>{module.icon}</span>
            <span className="truncate">{module.name}</span>
          </span>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

// Resource editing actions component
const ResourceEditActions = ({
  handleCancel,
  handleSave,
  isSaving,
}: {
  handleCancel: () => void;
  handleSave: () => void;
  isSaving: boolean;
}) => (
  <div className="flex justify-end gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={handleCancel}
      disabled={isSaving}
      className="h-7 text-xs px-2"
    >
      Cancel
    </Button>
    <Button
      size="sm"
      onClick={handleSave}
      disabled={isSaving}
      className="h-7 text-xs px-2"
    >
      Save
    </Button>
  </div>
);

// Helper function to handle resource deletion
async function handleDeleteResource(
  resourceId: string,
  onUpdate: (resource: Resource) => void,
  setIsSaving: (isSaving: boolean) => void,
  onComplete: () => void
) {
  try {
    setIsSaving(true);
    await axios.delete(`/api/resources/${resourceId}`);
    toast.success("Resource deleted");
    // Mark as deleted for UI
    onUpdate({ id: resourceId, _deleted: true } as Resource);
  } catch (error) {
    console.error("Error deleting resource:", error);
    toast.error("Failed to delete resource");
  } finally {
    setIsSaving(false);
    onComplete();
  }
}

interface ResourceRowProps {
  resource: Resource;
  modules: Module[];
  onUpdate: (updatedResource: Resource) => void;
  showModuleColumn: boolean;
}

// Wrap the ResourceRow component with React.memo to prevent unnecessary re-renders
const ResourceRow = memo(
  ({ resource, modules, onUpdate, showModuleColumn }: ResourceRowProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(resource.title);
    const [selectedModuleId, setSelectedModuleId] = useState(resource.moduleId);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [isInteractionDisabled] = useState(false);
    const [isUrlLoading, setIsUrlLoading] = useState(false);
    const loggedRef = useRef(false);

    // Get URL for regeneration
    const urlForRegeneration = (() => {
      if (resource.fileUrl) {
        return resource.fileUrl;
      }
      if (
        resource.fileUrl &&
        (resource.fileUrl.includes("supabase.co/storage") ||
          resource.fileUrl.includes("/object/sign/") ||
          resource.fileUrl.includes("?token="))
      ) {
        return resource.fileUrl;
      }
      return "";
    })();

    // Logging on initial render or URL change
    useEffect(() => {
      if (!loggedRef.current || resource.fileUrl !== urlForRegeneration) {
        loggedRef.current = true;
      }
    }, [resource.id, resource.fileUrl, urlForRegeneration]);

    const { isLoading: hookUrlLoading, regenerateUrl } = useResourceUrl(
      resource.id,
      urlForRegeneration
    );

    // Handle view or download resources
    const handleViewResource = async (e: React.MouseEvent) => {
      // Don't open resource if we're editing, if the click is disabled, or the URL is already loading
      if (isEditing || isInteractionDisabled || isUrlLoading || hookUrlLoading)
        return;

      // Don't proceed if the click target is an action button or inside a menu
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest(".context-menu") ||
        target.closest(".context-menu-content")
      ) {
        return;
      }

      setIsUrlLoading(true);

      // Check if the URL is a Supabase storage URL that needs regeneration
      const urlToCheck = resource.fileUrl;
      const isSupabaseStorageUrl =
        urlToCheck &&
        (urlToCheck.includes("supabase.co/storage") ||
          urlToCheck.includes("/object/sign/") ||
          urlToCheck.includes("?token="));


      // First priority: URLs that need regeneration (Supabase storage URLs)
      if (isSupabaseStorageUrl) {

        try {
          // Check if the token is expired or about to expire
          let needsRegeneration = false;

          if (urlToCheck) {
            try {
              // Extract the JWT token from the URL
              const tokenMatch = urlToCheck.match(/token=([^&]+)/);
              if (tokenMatch && tokenMatch[1]) {
                const token = tokenMatch[1];
                // Decode the token to get expiration time
                const base64Url = token.split(".")[1];
                const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split("")
                    .map(function (c) {
                      return (
                        "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                      );
                    })
                    .join("")
                );

                const payload = JSON.parse(jsonPayload);
                const expirationTime = payload.exp * 1000; // Convert to milliseconds
                const currentTime = Date.now();

                // Check if token is expired or will expire very soon (1 minute)
                const timeUntilExpiration = expirationTime - currentTime;
                const isExpiredOrExpiringSoon = timeUntilExpiration < 60 * 1000; // 1 minute instead of 10 minutes

                needsRegeneration = isExpiredOrExpiringSoon;
              } else {
                // If we can't extract the token, regenerate to be safe
                needsRegeneration = true;
              }
            } catch (tokenError) {
              console.error("❌ Error analyzing token:", tokenError);
              // If there's an error analyzing the token, regenerate to be safe
              needsRegeneration = true;
            }
          }

          let urlToOpen = urlToCheck;

          if (needsRegeneration) {
            console.log(
              "🔄 URL needs regeneration, calling regenerateUrl() function"
            );
            // Regenerate URL since it's expired or will expire soon
            const newUrl = await regenerateUrl();

            if (!newUrl) {
              toast.error("Failed to generate access URL. Please try again.");
              setIsUrlLoading(false);
              return;
            }

            urlToOpen = newUrl;
            console.log("✅ Successfully generated new URL");

            // Update the resource with the regenerated URL so future checks use the new URL
            const updatedResource = {
              ...resource,
              fileUrl: newUrl,
            };
            onUpdate(updatedResource);
          }

          // Open the URL
          const newWindow = window.open(urlToOpen, "_blank");

          // If window was blocked or failed to open
          if (!newWindow) {
            toast.info(
              "URL has been generated but popup was blocked. URL copied to clipboard instead."
            );
            // Copy URL to clipboard as fallback
            try {
              await navigator.clipboard.writeText(urlToOpen);
            } catch (clipboardErr) {
              console.error("❌ Clipboard copy failed:", clipboardErr);
              toast.error("Could not copy URL to clipboard. Please try again.");
            }
          }
        } catch (err) {
          console.error("❌ Error in view resource process:", err);

          // Show a more specific error message
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error";

          if (
            errorMessage.includes("JWT") ||
            errorMessage.includes("token") ||
            errorMessage.includes("expired")
          ) {
            toast.error(
              "Your access token has expired. Please refresh the page and try again."
            );
          } else {
            toast.error(`Error accessing document: ${errorMessage}`);
          }
        } finally {
          setIsUrlLoading(false);
        }
      }
      // Second check: Is this a regular URL that can be opened directly?
      else if (resource.fileUrl) {
        window.open(resource.fileUrl, "_blank");
        setIsUrlLoading(false);
      }
      // Final fallback: Neither URL type is available
      else {
        console.error("❌ Resource has no URL or fileUrl to open");
        toast.error("This resource doesn't have an associated URL or file");
        setIsUrlLoading(false);
      }
    };

    // Start editing
    const handleEdit = () => {
      setEditTitle(resource.title);
      setSelectedModuleId(resource.moduleId);
      setIsEditing(true);
    };

    // Cancel editing
    const handleCancel = () => {
      setIsEditing(false);
    };

    // Save resource update
    const saveResourceUpdate = async (updates: {
      title?: string;
      moduleId?: string;
    }) => {
      try {
        setIsSaving(true);
        await axios.put(`/api/resources/${resource.id}`, updates);

        // Update local state
        const updatedResource = {
          ...resource,
          ...updates,
          // If moduleId was updated, update the moduleName too
          ...(updates.moduleId && {
            moduleName:
              modules.find((m) => m.id === updates.moduleId)?.name ||
              resource.moduleName,
          }),
        };

        onUpdate(updatedResource);
        toast.success("Resource updated");
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating resource:", error);
        toast.error("Failed to update resource");
      } finally {
        setIsSaving(false);
      }
    };

    // Handle save
    const handleSave = () => {
      if (editTitle.trim().length < 2) {
        toast.error("Title must be at least 2 characters");
        return;
      }

      const updates: {
        title?: string;
        moduleId?: string;
      } = {};

      if (editTitle !== resource.title) {
        updates.title = editTitle;
      }

      if (selectedModuleId !== resource.moduleId) {
        updates.moduleId = selectedModuleId;
      }

      if (Object.keys(updates).length > 0) {
        saveResourceUpdate(updates);
      } else {
        setIsEditing(false);
      }
    };

    // Format date in a more readable way
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      if (isToday) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: now.getFullYear() !== date.getFullYear() ? "numeric" : undefined,
      };

      return date.toLocaleDateString(undefined, options);
    };

    return (
      <>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <tr
              className={`border-b hover:bg-muted/50 cursor-pointer text-sm ${
                resource.fileUrl ? "hover:bg-blue-50/30" : ""
              }`}
              onClick={handleViewResource}
            >
              <td className="p-2.5 flex items-center">
                {isEditing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-8 min-w-[200px] text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSave();
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center">
                    <span className="mr-3 text-muted-foreground">
                      {getFileIcon(resource.type)}
                    </span>
                    <span className="font-medium">{resource.title}</span>
                  </div>
                )}
              </td>
              <td className="p-2.5 text-xs text-muted-foreground">
                {getDetailedFileType(resource)}
              </td>
              {showModuleColumn && (
                <td className="p-2.5 text-xs">
                  {isEditing ? (
                    <ModuleSelector
                      selectedModuleId={selectedModuleId}
                      setSelectedModuleId={setSelectedModuleId}
                      modules={modules}
                    />
                  ) : (
                    <span className="text-muted-foreground">
                      {resource.moduleName || "—"}
                    </span>
                  )}
                </td>
              )}
              <td className="p-2.5 text-xs text-muted-foreground">
                {formatFileSize(resource.fileSize)}
              </td>
              <td className="p-2.5 text-xs text-muted-foreground">
                {formatDate(resource.createdAt)}
              </td>
              <td className="p-2.5 text-right">
                {isEditing ? (
                  <ResourceEditActions
                    handleCancel={handleCancel}
                    handleSave={handleSave}
                    isSaving={isSaving}
                  />
                ) : (
                  isUrlLoading && (
                    <span className="text-xs text-blue-600">Loading...</span>
                  )
                )}
              </td>
            </tr>
          </ContextMenuTrigger>
          <ContextMenuContent className="context-menu-content">
            <ContextMenuItem
              onClick={handleEdit}
              disabled={isEditing}
              className="cursor-pointer text-xs"
            >
              <Edit className="mr-2 h-4 w-4" /> Rename
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => setShowDeleteAlert(true)}
              disabled={isEditing}
              className="cursor-pointer text-destructive focus:text-destructive text-xs"
            >
              <Trash className="mr-2 h-4 w-4" /> Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        <DeleteConfirmationDialog
          isOpen={showDeleteAlert}
          setIsOpen={setShowDeleteAlert}
          resourceTitle={resource.title}
          onDelete={() =>
            handleDeleteResource(resource.id, onUpdate, setIsSaving, () =>
              setShowDeleteAlert(false)
            )
          }
          isDeleting={isSaving}
        />
      </>
    );
  }
);

// Add a display name for debugging
ResourceRow.displayName = "ResourceRow";

export { ResourceRow };
export type { Resource, Module, ResourceRowProps };
