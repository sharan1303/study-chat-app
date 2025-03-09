"use client";

import { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  Check,
  Edit,
  MessageSquare,
  Pencil,
  Tag,
  Trash,
  X,
  ThumbsDown,
  ThumbsUp,
  UploadCloud,
} from "lucide-react";
import { decodeModuleSlug, encodeModuleSlug } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import ModuleActions from "../module-actions";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

interface Module {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  resourceCount: number;
  updatedAt: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  url?: string | null;
  moduleId: string;
  moduleName?: string | null;
  createdAt: string;
  updatedAt?: string;
  _deleted?: boolean; // For UI tracking of deleted resources
}

// List of available icons
const icons = [
  "📚",
  "🧠",
  "🔬",
  "🧮",
  "🌍",
  "🖥️",
  "📊",
  "📝",
  "🎨",
  "🎭",
  "🏛️",
  "⚗️",
  "🔢",
  "📜",
  "🎵",
];

export default function ModuleDetailsPage({
  params,
}: {
  params: { moduleName: string };
}) {
  const router = useRouter();
  const [module, setModule] = useState<Module | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [allModules, setAllModules] = useState<
    { id: string; name: string; icon: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchModuleDetails = async () => {
      try {
        setIsLoading(true);
        // Decode the module name from URL parameters
        const decodedModuleName = decodeModuleSlug(params.moduleName);

        // Fetch all modules for the module selector
        const allModulesResponse = await axios.get("/api/modules");
        const modulesData = allModulesResponse.data;
        setAllModules(
          modulesData.map((m: any) => ({
            id: m.id,
            name: m.name,
            icon: m.icon,
          }))
        );

        // First try exact match (case-insensitive)
        let moduleData = modulesData.find(
          (m: any) => m.name.toLowerCase() === decodedModuleName.toLowerCase()
        );

        // If not found with exact match, try a more flexible search
        if (!moduleData) {
          // Try matching with normalized strings (removing special chars)
          moduleData = modulesData.find((m: any) => {
            const normalizedDbName = m.name
              .toLowerCase()
              .replace(/[^\w\s]/g, "");
            const normalizedSearchName = decodedModuleName
              .toLowerCase()
              .replace(/[^\w\s]/g, "");
            return normalizedDbName === normalizedSearchName;
          });

          // If still not found, try API query
          if (!moduleData) {
            // If not found by case-insensitive match, try direct API query
            const moduleResponse = await axios.get(
              `/api/modules?name=${decodedModuleName}`
            );

            if (moduleResponse.data.length > 0) {
              moduleData = moduleResponse.data[0];
            } else {
              return notFound();
            }
          }
        }

        setModule(moduleData);

        // Update the lastStudied timestamp when viewing a module
        // This ensures it appears at the top of the sidebar
        await axios.put(`/api/modules/${moduleData.id}/last-studied`);

        // Fetch resources for this module
        const resourcesResponse = await axios.get(
          `/api/resources?moduleId=${moduleData.id}`
        );
        setResources(resourcesResponse.data);
      } catch (error) {
        console.error("Error fetching module details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModuleDetails();
  }, [params.moduleName]);

  // Set initial edit values when module data loads
  useEffect(() => {
    if (module) {
      setEditTitle(module.name);
      setEditDescription(module.description || "");
    }
  }, [module]);

  // Format module name for URLs: replace spaces with hyphens
  const formatModuleNameForUrl = (name: string) => {
    return encodeModuleSlug(name);
  };

  // Save module updates
  const saveModuleUpdate = async (updates: {
    name?: string;
    description?: string;
    icon?: string;
  }) => {
    if (!module) return;

    try {
      setIsSaving(true);
      await axios.put(`/api/modules/${module.id}`, {
        name: updates.name !== undefined ? updates.name : module.name,
        description:
          updates.description !== undefined
            ? updates.description
            : module.description,
        icon: updates.icon !== undefined ? updates.icon : module.icon,
      });

      // Update local state for immediate UI feedback
      setModule({
        ...module,
        ...updates,
      });

      toast.success("Module updated");

      // Only use a full page refresh for name changes
      if (updates.name && updates.name !== module.name) {
        // For name updates, use a full page refresh to update the sidebar
        setTimeout(() => {
          const formattedName = formatModuleNameForUrl(updates.name || "");
          window.location.href = `/modules/${formattedName}`;
        }, 600);
      } else {
        // For description and icon updates, just use router.refresh()
        // This is less disruptive but still updates server components
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating module:", error);
      toast.error("Failed to update module");
    } finally {
      setIsSaving(false);
      setIsEditingTitle(false);
      setIsEditingDescription(false);
    }
  };

  // Handle title update
  const handleTitleSave = () => {
    if (editTitle.trim().length < 2) {
      toast.error("Title must be at least 2 characters");
      return;
    }
    saveModuleUpdate({ name: editTitle });
  };

  // Handle description update
  const handleDescriptionSave = () => {
    saveModuleUpdate({ description: editDescription });
  };

  // Handle icon update
  const handleIconChange = (newIcon: string) => {
    saveModuleUpdate({ icon: newIcon });
  };

  // Cancel editing
  const cancelTitleEdit = () => {
    setEditTitle(module?.name || "");
    setIsEditingTitle(false);
  };

  const cancelDescriptionEdit = () => {
    setEditDescription(module?.description || "");
    setIsEditingDescription(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col p-3">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/modules")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-7 w-36 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="space-y-6">
          <div className="h-5 w-3/4 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-16 w-full bg-gray-200 animate-pulse rounded"></div>
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!module) {
    return notFound();
  }

  return (
    <div className="flex flex-col min-h-screen p-3">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/modules")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Module icon with popover for changing */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="text-2xl cursor-pointer hover:bg-muted h-10 w-10 p-0"
              >
                {module.icon}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="grid grid-cols-5 gap-2">
                {icons.map((icon) => (
                  <Button
                    key={icon}
                    variant={module.icon === icon ? "default" : "outline"}
                    className="h-10 w-10 p-0 text-xl"
                    onClick={() => handleIconChange(icon)}
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Editable title */}
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-xl font-bold h-10"
                autoFocus
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
              className="text-2xl font-bold cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
              onClick={() => setIsEditingTitle(true)}
            >
              {module.name}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="flex items-center gap-2"
            variant="outline"
            onClick={() => router.push(`/${module.name}`)}
          >
            <MessageSquare className="h-5 w-5" />
            Go to Chat
          </Button>
          <ModuleActions moduleId={module.id} moduleName={module.name} />
        </div>
      </div>

      <div className="space-y-6 px-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          {/* Editable description */}
          {isEditingDescription ? (
            <div className="flex flex-col gap-2">
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="min-h-[150px]"
                placeholder="Add a description..."
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelDescriptionEdit}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleDescriptionSave}
                  disabled={isSaving}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p
              className="text-muted-foreground cursor-pointer hover:bg-muted/50 p-4 rounded min-h-[80px]"
              onClick={() => setIsEditingDescription(true)}
            >
              {module.description ||
                "No description provided. Click to add one."}
            </p>
          )}
        </div>

        <Separator className="my-6" />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Resources</h2>
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/modules/resources/new?moduleId=${module.id}`)
              }
            >
              Add Resource
            </Button>
          </div>

          {resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
              <h3 className="text-xl font-medium">No resources found</h3>
              <p className="text-muted-foreground">
                Add resources to this module to get started
              </p>
              <Button
                onClick={() =>
                  router.push(`/modules/resources/new?moduleId=${module.id}`)
                }
              >
                Add Resource
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-md">
              <table className="w-full min-w-full table-fixed">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium w-1/4">Title</th>
                    <th className="text-left p-3 font-medium w-1/3">
                      Description
                    </th>
                    <th className="text-left p-3 font-medium w-1/8">Type</th>
                    <th className="text-left p-3 font-medium w-1/8">Added</th>
                    <th className="text-right p-3 font-medium w-1/8"></th>
                  </tr>
                </thead>
                <tbody>
                  {resources
                    .filter((resource) => !resource._deleted) // Filter out deleted resources
                    .map((resource) => (
                      <ResourceRow
                        key={resource.id}
                        resource={resource}
                        modules={allModules}
                        currentModuleId={module?.id}
                        onUpdate={(updatedResource) => {
                          if (updatedResource._deleted) {
                            // If resource was deleted, keep it in state but mark as deleted
                            setResources(
                              resources.map((r) =>
                                r.id === updatedResource.id
                                  ? { ...r, _deleted: true }
                                  : r
                              )
                            );
                          } else if (updatedResource.moduleId !== module?.id) {
                            // If module changed, remove from this list
                            setResources(
                              resources.map((r) =>
                                r.id === updatedResource.id
                                  ? { ...r, _deleted: true }
                                  : r
                              )
                            );
                          } else {
                            // Regular update
                            setResources(
                              resources.map((r) =>
                                r.id === updatedResource.id
                                  ? updatedResource
                                  : r
                              )
                            );
                          }
                        }}
                      />
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Resource row component with context menu
function ResourceRow({
  resource,
  onUpdate,
  modules = [],
  currentModuleId,
}: {
  resource: Resource;
  onUpdate: (updatedResource: Resource) => void;
  modules?: { id: string; name: string; icon: string }[];
  currentModuleId?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(resource.title);
  const [editDescription, setEditDescription] = useState(
    resource.description || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showModuleChangeAlert, setShowModuleChangeAlert] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(resource.moduleId);

  // Save resource update
  const saveResourceUpdate = async (updates: {
    title?: string;
    description?: string;
    moduleId?: string;
  }) => {
    try {
      setIsSaving(true);
      const response = await axios.put(
        `/api/resources/${resource.id}`,
        updates
      );

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
      if (selectedModuleId !== currentModuleId) {
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
      // Remove resource from the list
      onUpdate({ ...resource, _deleted: true } as any);
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource");
    } finally {
      setIsSaving(false);
      setShowDeleteAlert(false);
    }
  };

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
                  className="h-9"
                  autoFocus
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
                  className="text-sm min-h-[20px] resize-none"
                  placeholder="Add a description..."
                />
              ) : (
                <div className="line-clamp-2 text-sm text-muted-foreground">
                  {resource.description || "No description."}
                </div>
              )}
            </td>
            <td className="p-3 text-sm">{resource.type}</td>
            <td className="p-3 text-sm text-muted-foreground">
              <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
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
                resource.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (resource.url) window.open(resource.url, "_blank");
                    }}
                  >
                    View
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
              This will permanently delete "{resource.title}" and cannot be
              undone.
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
              This resource will be moved to another module and will no longer
              appear in the current module.
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

// Add this export to allow dynamic rendering
export const dynamic = "force-dynamic";
