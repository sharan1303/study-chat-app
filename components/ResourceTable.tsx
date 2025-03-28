"use client";

import { useState, useRef, useEffect, memo } from "react";
import { Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <p className="text-muted-foreground text-sm">Loading resources...</p>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
        <h3 className="text-xl font-medium">No resources found</h3>
        <p className="text-muted-foreground">Add resources to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-md">
      <table className="w-full min-w-full table-fixed">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium w-1/5">Title</th>
            <th className="text-left p-3 font-medium w-1/4">Description</th>
            <th className="text-left p-3 font-medium w-1/12">Type</th>
            {showModuleColumn && (
              <th className="text-left p-3 font-medium w-1/5">Module</th>
            )}
            <th className="text-left p-3 font-medium w-1/7">Added</th>
            <th className="text-right p-3 font-medium w-1/8"></th>
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
    const [editDescription, setEditDescription] = useState(
      resource.description || ""
    );
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
      setEditDescription(resource.description || "");
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
      description?: string;
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

      const updates: { title?: string; description?: string; moduleId?: string } =
        {};

      if (editTitle !== resource.title) {
        updates.title = editTitle;
      }

      if (editDescription !== resource.description) {
        updates.description = editDescription;
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

    return (
      <>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <tr className="border-b hover:bg-muted/50 cursor-context-menu">
              <td className="p-3">
                {isEditing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-9 min-w-[200px]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSave();
                      }
                    }}
                  />
                ) : (
                  <div className="font-medium">{resource.title}</div>
                )}
              </td>
              <td className="p-3">
                {isEditing ? (
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="text-sm min-h-[10px] resize-none"
                    placeholder="Add a description..."
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                        e.preventDefault();
                        handleSave();
                      }
                    }}
                  />
                ) : (
                  <div className="line-clamp-2 text-sm text-muted-foreground">
                    {resource.description || "No description provided"}
                  </div>
                )}
              </td>
              <td className="p-3 text-sm">{resource.type}</td>
              {showModuleColumn && (
                <td className="p-3 text-sm">
                  {isEditing ? (
                    <Select
                      value={selectedModuleId}
                      onValueChange={setSelectedModuleId}
                    >
                      <SelectTrigger className="w-[180px] h-9">
                        <SelectValue placeholder="Select a module" />
                      </SelectTrigger>
                      <SelectContent>
                        {modules.map((module) => (
                          <SelectItem key={module.id} value={module.id}>
                            <span className="flex items-center gap-2">
                              <span>{module.icon}</span>
                              <span>{module.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span>{resource.moduleName || "No module"}</span>
                  )}
                </td>
              )}
              <td className="p-3 text-sm text-muted-foreground">
                {new Date(resource.createdAt).toLocaleDateString()}
              </td>
              <td className="p-3 text-right">
                {isEditing ? (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      Save
                    </Button>
                  </div>
                ) : (
                  (resource.url || resource.fileUrl) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log(
                          "🖱️ View button clicked for resource:",
                          resource.title
                        );
                        handleViewResource();
                      }}
                      disabled={isUrlLoading || hookUrlLoading}
                    >
                      {isUrlLoading || hookUrlLoading ? "Loading..." : "View"}
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
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" /> Edit
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => setShowDeleteAlert(true)}
              disabled={isEditing}
              className="cursor-pointer text-destructive focus:text-destructive"
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
