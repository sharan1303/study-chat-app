"use client";

import { Suspense, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PlusCircle, Search, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { SignInButton } from "@clerk/nextjs";
import { formatDate } from "@/lib/utils";
import { useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";
import { encodeModuleSlug } from "@/lib/utils";
import { ResourceUploadButton } from "@/components/ResourceUploadButton";

// Client component for module operations to be loaded in a Suspense boundary
import ModuleOperations from "./module-operations";

// Define interfaces for the module data
interface Module {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  resourceCount: number;
  updatedAt: string;
}

// Define interface for the resource data
interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  url?: string | null;
  moduleId: string;
  moduleName?: string | null;
  createdAt: string;
  _deleted?: boolean;
}

function ModulesLoading() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4 px-8">
        <div className="flex items-center justify-between px-3 py-5">
          <div className="h-7 w-36 bg-gray-200 animate-pulse rounded"></div>
        </div>

        {/* Tabs skeleton */}
        <div className="px-3">
          <div className="grid w-full max-w-md grid-cols-2 h-10 bg-gray-100 rounded-md">
            <div className="m-1 h-8 w-auto bg-gray-200 animate-pulse rounded-sm"></div>
            <div className="m-1 h-8 w-auto bg-gray-100 rounded-sm"></div>
          </div>

          {/* Search bar and button skeleton */}
          <div className="relative flex items-center gap-2 mt-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className="h-10 w-36 bg-gray-200 animate-pulse rounded"></div>
          </div>

          {/* Module cards skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
                <CardFooter>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Create a component that uses useSearchParams inside Suspense
function ModulesPageContent() {
  const { isLoaded, isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  const [activeTab, setActiveTab] = useState(() => {
    // Get tab from URL param or default to "modules"
    return searchParams?.get("tab") || "modules";
  });
  const [isLoading, setIsLoading] = useState(true);
  const shouldOpenResourceUpload =
    searchParams?.get("openResourceUpload") === "true";
  const preselectedModuleId = searchParams?.get("moduleId");
  const [openResourceUpload, setOpenResourceUpload] = useState(
    shouldOpenResourceUpload
  );

  // This effect fetches the modules data from the API
  useEffect(() => {
    async function fetchModules() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/modules");

        if (!response.ok) {
          throw new Error("Failed to fetch modules");
        }

        const data = await response.json();
        // Extract modules from the response object
        const modulesList = data.modules || [];
        setModules(modulesList);
        setFilteredModules(modulesList);
      } catch (error) {
        console.error("Error fetching modules:", error);
        // Set modules to empty array on error
        setModules([]);
        setFilteredModules([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (isSignedIn) {
      fetchModules();
    } else {
      setIsLoading(false);
    }
  }, [isSignedIn]);

  // Filter modules based on search query whenever searchQuery changes
  useEffect(() => {
    if (activeTab === "modules" && modules.length > 0) {
      if (!searchQuery) {
        setFilteredModules(modules);
      } else {
        const filtered = modules.filter(
          (module) =>
            module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (module.description &&
              module.description
                .toLowerCase()
                .includes(searchQuery.toLowerCase()))
        );
        setFilteredModules(filtered);
      }
    }
  }, [searchQuery, modules, activeTab]);

  // Add to existing useEffect that loads modules
  useEffect(() => {
    // Handle opening the resource upload dialog from URL params
    if (shouldOpenResourceUpload) {
      setOpenResourceUpload(true);
      // Remove the query parameter from the URL without refreshing the page
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("openResourceUpload");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [shouldOpenResourceUpload]);

  if (!isLoaded) {
    return <ModulesLoading />;
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex-1 space-y-4">
          <div className="flex p-5 items-center">
            <h1 className="font-bold text-2xl">Modules</h1>
          </div>
          <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
            <h3 className="text-xl font-medium">Please sign in</h3>
            <p className="text-muted-foreground">
              You need to be signed in to view and manage your modules
            </p>
            <SignInButton mode="modal">
              <Button>Sign in</Button>
            </SignInButton>
          </div>
        </div>
      </div>
    );
  }

  // Replace it with this simple wrapper component
  function ResourcesWrapper({ searchQuery }: { searchQuery: string }) {
    const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
    const [modules, setModules] = useState<
      { id: string; name: string; icon: string }[]
    >([]);
    const [resourcesLoading, setResourcesLoading] = useState(true);

    // Fetch resources from the API
    useEffect(() => {
      async function fetchData() {
        try {
          setResourcesLoading(true);

          // Fetch all modules for the selector
          const modulesResponse = await fetch("/api/modules");
          if (!modulesResponse.ok) {
            throw new Error("Failed to fetch modules");
          }
          const modulesData = await modulesResponse.json();
          const modulesList = modulesData.modules || [];
          setModules(
            modulesList.map((m: Module) => ({
              id: m.id,
              name: m.name,
              icon: m.icon,
            }))
          );

          // Fetch resources
          const resourcesResponse = await fetch("/api/resources");
          if (!resourcesResponse.ok) {
            throw new Error("Failed to fetch resources");
          }

          const resourcesData = await resourcesResponse.json();

          // Initialize filtered resources
          if (!searchQuery) {
            setFilteredResources(resourcesData);
          } else {
            const filtered = resourcesData.filter(
              (resource: Resource) =>
                resource.title
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                (resource.description &&
                  resource.description
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())) ||
                (resource.moduleName &&
                  resource.moduleName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()))
            );
            setFilteredResources(filtered);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          // Set resources to empty array on error
          setFilteredResources([]);
        } finally {
          setResourcesLoading(false);
        }
      }

      fetchData();
    }, [searchQuery]);

    if (resourcesLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
              <CardFooter>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    if (filteredResources.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-xl font-medium">No resources found</h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Try a different search term"
              : "Create your first resource to get started"}
          </p>
        </div>
      );
    }

    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          {searchQuery && (
            <p className="text-muted-foreground">
              Showing results for: &quot;{searchQuery}&quot;
            </p>
          )}
        </div>

        <div className="overflow-x-auto border rounded-md">
          <table className="w-full min-w-full table-fixed">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium w-1/5">Title</th>
                <th className="text-left p-3 font-medium w-1/4">Description</th>
                <th className="text-left p-3 font-medium w-1/12">Type</th>
                <th className="text-left p-3 font-medium w-1/5">Module</th>
                <th className="text-left p-3 font-medium w-1/7">Added</th>
                <th className="text-right p-3 font-medium w-1/8"></th>
              </tr>
            </thead>
            <tbody>
              {filteredResources
                .filter((resource) => !resource._deleted)
                .map((resource) => (
                  <ResourceRowWithContext
                    key={resource.id}
                    resource={resource}
                    modules={modules}
                    onUpdate={(updatedResource) => {
                      if (updatedResource._deleted) {
                        // If resource was deleted, mark as deleted in the UI
                        setFilteredResources((resources) =>
                          resources.map((r) =>
                            r.id === updatedResource.id
                              ? { ...r, _deleted: true }
                              : r
                          )
                        );
                      } else {
                        // Regular update
                        setFilteredResources((resources) =>
                          resources.map((r) =>
                            r.id === updatedResource.id ? updatedResource : r
                          )
                        );
                      }
                    }}
                  />
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4 px-8">
        <div className="flex items-center justify-between px-3 py-4">
          <h1 className="font-bold text-xl">Content</h1>
        </div>

        {/* Tabs for Module and Resources - now at the top */}
        <Tabs
          defaultValue={activeTab}
          className="px-3"
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="resources">All Resources</TabsTrigger>
          </TabsList>

          {/* Search bar with contextual button - now below tabs */}
          <div className="relative flex items-center gap-2 mt-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={
                  activeTab === "modules"
                    ? "Search modules..."
                    : "Search resources..."
                }
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Contextual button that changes based on active tab */}
            {activeTab === "modules" ? (
              <Suspense fallback={<Button disabled>Loading...</Button>}>
                <ModuleOperations />
              </Suspense>
            ) : (
              <ResourceUploadButton
                variant="outline"
                moduleId={preselectedModuleId || undefined}
                initialOpen={openResourceUpload}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Resource
              </ResourceUploadButton>
            )}
          </div>

          <TabsContent value="modules" className="mt-2">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                    <CardFooter>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : filteredModules.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
                <h3 className="text-xl font-medium">No modules found</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Try a different search term"
                    : "Create your first module to get started"}
                </p>
                {!searchQuery}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredModules.map((module) => (
                  <Link
                    href={`/modules/${encodeModuleSlug(module.name)}`}
                    key={module.name}
                  >
                    <Card className="hover:bg-muted/50 transition-colors">
                      <CardHeader>
                        <CardTitle>
                          <span className="mr-2">{module.icon}</span>
                          {module.name}
                        </CardTitle>
                        <CardDescription>
                          {module.description || "No description"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          {module.resourceCount}{" "}
                          {module.resourceCount === 1
                            ? "resource"
                            : "resources"}
                        </div>
                      </CardContent>
                      <CardFooter className="text-xs text-muted-foreground">
                        Updated {formatDate(module.updatedAt)}
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resources" className="mt-2">
            <ResourcesWrapper searchQuery={searchQuery} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Resource row component with context menu for all resources page
function ResourceRowWithContext({
  resource,
  modules,
  onUpdate,
}: {
  resource: Resource;
  modules: { id: string; name: string; icon: string }[];
  onUpdate: (updatedResource: Resource) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(resource.title);
  const [editDescription, setEditDescription] = useState(
    resource.description || ""
  );
  const [selectedModuleId, setSelectedModuleId] = useState(resource.moduleId);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showModuleChangeAlert, setShowModuleChangeAlert] = useState(false);

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
      setShowModuleChangeAlert(true);
      return;
    }

    if (Object.keys(updates).length > 0) {
      saveResourceUpdate(updates);
    } else {
      setIsEditing(false);
    }
  };

  // Handle module change confirmation
  const handleModuleChangeConfirm = () => {
    // Create an update with just the moduleId
    const updates = { moduleId: selectedModuleId };
    saveResourceUpdate(updates);
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
                />
              ) : (
                <div className="line-clamp-2 text-sm text-muted-foreground">
                  {resource.description || "No description provided"}
                </div>
              )}
            </td>
            <td className="p-3 text-sm">{resource.type}</td>
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

// Main component with Suspense boundary to prevent static rendering issues
export default function ModulesPage() {
  return (
    <Suspense fallback={<ModulesLoading />}>
      <ModulesPageContent />
    </Suspense>
  );
}

// Add this export to allow dynamic rendering
export const dynamic = "force-dynamic";
