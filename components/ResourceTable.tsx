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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  url?: string | null;
  fileUrl?: string;
  moduleId: string;
  moduleName?: string | null;
  createdAt: string;
  updatedAt?: string;
  _deleted?: boolean;
  fileSize?: number;
}

interface Module {
  id: string;
  name: string;
  icon: string;
}

interface ResourceTableProps {
  resources: Resource[];
  modules: Module[];
  onUpdate: (updatedResource: Resource) => void;
  showModuleColumn?: boolean;
  currentModuleId?: string;
  isLoading?: boolean;
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

  // If type includes a slash (e.g., image/jpg), extract the primary type
  const primaryType = type.includes("/")
    ? type.split("/")[0].toLowerCase()
    : type.toLowerCase();

  if (primaryType === "pdf" || type === "pdf") return <FileText size={18} />;
  if (primaryType === "image") return <Image size={18} />;
  if (primaryType === "video") return <FileVideo size={18} />;
  if (primaryType === "audio") return <FileAudio size={18} />;
  if (
    primaryType === "text" ||
    primaryType === "document" ||
    type.includes("document")
  )
    return <FileText size={18} />;
  if (primaryType === "code") return <FileText size={18} />;
  if (
    primaryType.includes("zip") ||
    primaryType.includes("archive") ||
    primaryType === "archive"
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
  // If type already has the format "type/extension", capitalize and return it
  if (resource.type && resource.type.includes("/")) {
    const [type, ext] = resource.type.split("/");
    return `${type.charAt(0).toUpperCase() + type.slice(1)}/${ext}`;
  }

  const ext = getFileExtension(resource);

  // Map common extensions to more readable names
  const extensionMap: Record<string, string> = {
    // Images
    jpg: "JPEG Image",
    jpeg: "JPEG Image",
    png: "PNG Image",
    gif: "GIF Image",
    svg: "SVG Image",
    webp: "WebP Image",

    // Documents
    pdf: "PDF Document",
    doc: "Word Document",
    docx: "Word Document",
    txt: "Text File",
    rtf: "RTF Document",

    // Spreadsheets
    xls: "Excel Spreadsheet",
    xlsx: "Excel Spreadsheet",
    csv: "CSV File",

    // Presentations
    ppt: "PowerPoint",
    pptx: "PowerPoint",

    // Audio
    mp3: "MP3 Audio",
    wav: "WAV Audio",
    ogg: "OGG Audio",

    // Video
    mp4: "MP4 Video",
    mov: "QuickTime Video",
    avi: "AVI Video",
    webm: "WebM Video",

    // Archives
    zip: "ZIP Archive",
    rar: "RAR Archive",
    "7z": "7Z Archive",
    tar: "TAR Archive",
    gz: "GZip Archive",

    // Code
    html: "HTML File",
    css: "CSS File",
    js: "JavaScript",
    ts: "TypeScript",
    jsx: "React JSX",
    tsx: "React TSX",
    json: "JSON File",
    py: "Python File",
    php: "PHP File",
  };

  return (
    extensionMap[ext] ||
    resource.type.charAt(0).toUpperCase() + resource.type.slice(1)
  );
};

export function ResourceTable({
  resources,
  modules,
  onUpdate,
  showModuleColumn = true,
  currentModuleId,
  isLoading = false,
}: ResourceTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto border rounded-md">
        <table className="w-full min-w-full table-fixed">
          <thead>
            <tr className="border-b bg-muted/50 text-xs font-medium text-muted-foreground">
              <th className="text-left p-2.5 w-5/12">Name</th>
              <th className="text-left p-2.5 w-1/12">Type</th>
              {showModuleColumn && (
                <th className="text-left p-2.5 w-2/12">Module</th>
              )}
              <th className="text-left p-2.5 w-1/12">Size</th>
              <th className="text-left p-2.5 w-2/12">Added</th>
              <th className="text-right p-2.5 w-1/12"></th>
            </tr>
          </thead>
          <tbody>
            {Array(5)
              .fill(0)
              .map((_, index) => (
                <tr key={index} className="border-b animate-pulse">
                  <td className="p-2.5">
                    <div className="flex items-center">
                      <div className="mr-3 bg-muted-foreground/20 rounded-full w-[18px] h-[18px]"></div>
                      <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
                    </div>
                  </td>
                  <td className="p-2.5">
                    <div className="h-3 bg-muted-foreground/20 rounded w-4/5"></div>
                  </td>
                  {showModuleColumn && (
                    <td className="p-2.5">
                      <div className="h-3 bg-muted-foreground/20 rounded w-2/3"></div>
                    </td>
                  )}
                  <td className="p-2.5">
                    <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                  </td>
                  <td className="p-2.5">
                    <div className="h-3 bg-muted-foreground/20 rounded w-2/3"></div>
                  </td>
                  <td className="p-2.5 text-right">
                    <div className="h-7 bg-muted-foreground/20 rounded w-12 ml-auto"></div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-md">
      <table className="w-full min-w-full table-fixed">
        <thead>
          <tr className="border-b bg-muted/50 text-xs font-medium text-muted-foreground">
            <th className="text-left p-2.5 w-5/12">Name</th>
            <th className="text-left p-2.5 w-1/12">Type</th>
            {showModuleColumn && (
              <th className="text-left p-2.5 w-2/12">Module</th>
            )}
            <th className="text-left p-2.5 w-1/12">Size</th>
            <th className="text-left p-2.5 w-2/12">Added</th>
            <th className="text-right p-2.5 w-1/12"></th>
          </tr>
        </thead>
        <tbody>
          {resources
            .filter((resource) => !resource._deleted)
            .map((resource) => (
              <ResourceRow
                key={resource.id}
                resource={resource}
                modules={modules}
                onUpdate={onUpdate}
                showModuleColumn={showModuleColumn}
                currentModuleId={currentModuleId}
              />
            ))}
        </tbody>
      </table>
    </div>
  );
}

// Wrap the ResourceRow component with React.memo to prevent unnecessary re-renders
const ResourceRow = memo(
  ({
    resource,
    modules,
    onUpdate,
    showModuleColumn,
    currentModuleId,
  }: {
    resource: Resource;
    modules: Module[];
    onUpdate: (updatedResource: Resource) => void;
    showModuleColumn: boolean;
    currentModuleId?: string;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(resource.title);
    const [selectedModuleId, setSelectedModuleId] = useState(resource.moduleId);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [showModuleChangeAlert, setShowModuleChangeAlert] = useState(false);
    const [isInteractionDisabled] = useState(false);
    const [isUrlLoading, setIsUrlLoading] = useState(false);
    const loggedRef = useRef(false);

    // Always call hooks unconditionally
    const urlForRegeneration = (() => {
      // First try to use fileUrl if available
      if (resource.fileUrl) {
        return resource.fileUrl;
      }

      // Then fall back to URL if it's a Supabase storage URL
      if (
        resource.url &&
        (resource.url.includes("supabase.co/storage") ||
          resource.url.includes("/object/sign/") ||
          resource.url.includes("?token="))
      ) {
        return resource.url;
      }

      // Return empty string if no valid URL is found
      return "";
    })();

    // Only log on initial render or when URL changes
    useEffect(() => {
      if (!loggedRef.current || resource.fileUrl !== urlForRegeneration) {
        console.log("🔄 Initializing useResourceUrl hook with:", {
          resourceId: resource.id,
          urlForRegeneration,
        });
        loggedRef.current = true;
      }
    }, [resource.id, resource.fileUrl, urlForRegeneration]);

    const { isLoading: hookUrlLoading, regenerateUrl } = useResourceUrl(
      resource.id,
      urlForRegeneration
    );

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
        if (currentModuleId && selectedModuleId !== currentModuleId) {
          // Show confirmation if changing to a different module
          setShowModuleChangeAlert(true);
          return;
        }
        updates.moduleId = selectedModuleId;
      }

      if (Object.keys(updates).length > 0) {
        saveResourceUpdate(updates);
      } else {
        setIsEditing(false);
      }
    };

    // Handle module change confirmation
    const handleModuleChangeConfirm = () => {
      saveResourceUpdate({ moduleId: selectedModuleId });
      setShowModuleChangeAlert(false);
    };

    // Handle delete resource
    const handleDelete = async () => {
      try {
        setIsSaving(true);
        await axios.delete(`/api/resources/${resource.id}`);
        toast.success("Resource deleted");
        // Mark as deleted for UI
        onUpdate({ ...resource, _deleted: true });
      } catch (error) {
        console.error("Error deleting resource:", error);
        toast.error("Failed to delete resource");
      } finally {
        setIsSaving(false);
        setShowDeleteAlert(false);
      }
    };

    // Handle view or download resources
    const handleViewResource = async () => {
      if (isEditing || isInteractionDisabled) return;
      setIsUrlLoading(true);

      console.log("🔍 Resource details:", {
        id: resource.id,
        title: resource.title,
        type: resource.type,
        hasFileUrl: Boolean(resource.fileUrl),
        fileUrl: resource.fileUrl,
        hasUrl: Boolean(resource.url),
        url: resource.url,
      });

      // Check if the URL is a Supabase storage URL that needs regeneration
      // This works with either url or fileUrl properties
      const urlToCheck = resource.fileUrl || resource.url;
      const isSupabaseStorageUrl =
        urlToCheck &&
        (urlToCheck.includes("supabase.co/storage") ||
          urlToCheck.includes("/object/sign/") ||
          urlToCheck.includes("?token="));

      console.log("🔍 URL analysis:", { urlToCheck, isSupabaseStorageUrl });

      // First priority: URLs that need regeneration (Supabase storage URLs)
      if (isSupabaseStorageUrl) {
        console.log("📄 Starting resource view process for:", resource.title);
        console.log("🔍 Original storage URL:", urlToCheck);

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

                console.log("🔍 Token analysis:", {
                  expirationTime: new Date(expirationTime).toISOString(),
                  currentTime: new Date(currentTime).toISOString(),
                  timeUntilExpiration:
                    Math.floor(timeUntilExpiration / 1000) + " seconds",
                  isExpiredOrExpiringSoon,
                });

                needsRegeneration = isExpiredOrExpiringSoon;
              } else {
                // If we can't extract the token, regenerate to be safe
                console.log(
                  "⚠️ Could not extract token from URL, regenerating to be safe"
                );
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
            console.log("🔄 regenerateUrl() returned:", newUrl);

            if (!newUrl) {
              console.error("❌ URL regeneration failed - No URL returned");
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
          } else {
            console.log("✅ URL is still valid, using existing URL");
          }

          console.log("🌐 Opening URL:", urlToOpen);
          // Open the URL
          const newWindow = window.open(urlToOpen, "_blank");
          console.log(
            "🌐 Window open result:",
            newWindow ? "Success" : "Failed/Blocked"
          );

          // If window was blocked or failed to open
          if (!newWindow) {
            console.log("⚠️ Window open failed, attempting clipboard fallback");
            toast.info(
              "URL has been generated but popup was blocked. URL copied to clipboard instead."
            );
            // Copy URL to clipboard as fallback
            try {
              await navigator.clipboard.writeText(urlToOpen);
              console.log("📋 URL copied to clipboard");
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
      else if (resource.url) {
        console.log("🌐 Opening regular URL:", resource.url);
        window.open(resource.url, "_blank");
      }
      // Final fallback: Neither URL type is available
      else {
        console.error("❌ Resource has no URL or fileUrl to open");
        toast.error("This resource doesn't have an associated URL or file");
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
            <tr className="border-b hover:bg-muted/50 cursor-pointer text-sm">
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
                    <Select
                      value={selectedModuleId}
                      onValueChange={setSelectedModuleId}
                    >
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="Select a module" />
                      </SelectTrigger>
                      <SelectContent>
                        {modules.map((module) => (
                          <SelectItem key={module.id} value={module.id}>
                            <span className="flex items-center gap-2 text-xs">
                              <span>{module.icon}</span>
                              <span>{module.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                ) : (
                  (resource.url || resource.fileUrl) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log(
                          "🖱️ View button clicked for resource:",
                          resource.title
                        );
                        handleViewResource();
                      }}
                      disabled={isUrlLoading || hookUrlLoading}
                      className="h-7 text-xs hover:bg-blue-50 hover:text-blue-600"
                    >
                      {isUrlLoading || hookUrlLoading ? "Loading..." : "Open"}
                    </Button>
                  )
                )}
              </td>
            </tr>
          </ContextMenuTrigger>
          <ContextMenuContent>
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{resource.title}&quot; and
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Module Change Confirmation Dialog */}
        <AlertDialog
          open={showModuleChangeAlert}
          onOpenChange={setShowModuleChangeAlert}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change module?</AlertDialogTitle>
              <AlertDialogDescription>
                This will move the resource to a different module.
                {currentModuleId &&
                  " It will no longer appear in the current module."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleModuleChangeConfirm}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
);

// Add a display name for debugging
ResourceRow.displayName = "ResourceRow";
