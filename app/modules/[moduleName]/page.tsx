"use client";

import { useEffect, useState, use } from "react";
import { notFound, useRouter } from "next/navigation";
import axios from "axios";
import { Check, Edit, MessageSquare, Trash, Upload, X } from "lucide-react";
import { decodeModuleSlug, encodeModuleSlug } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import ModuleActions from "../module-actions";
import { ResourceUploadButton } from "@/components/ResourceUploadButton";
import { ResourceTable } from "@/components/ResourceTable";

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

/**
 * Renders and manages the details of a specific module.
 *
 * This component fetches module data based on a module name provided via URL parameters and displays the module’s icon,
 * title, description, and its associated resources. It supports editing the module's title, description, and icon, with updates
 * triggering either a full page refresh (for name changes) or a component refresh (for description and icon changes). For signed-in
 * users, the component loads related resources; for anonymous users, it presents an empty resource list. If the module cannot be
 * found, a notFound response is triggered.
 *
 * @param props - Contains URL parameters with the module name.
 *
 * @returns A React element representing the module details page.
 */
export default function ModuleDetailsPage(props: {
  params: Promise<{ moduleName: string }>;
}) {
  const params = use(props.params);
  const router = useRouter();
  const { isSignedIn } = useAuth();
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
        console.log(`Looking for module with name: "${decodedModuleName}"`);

        // First try an exact match query
        const exactMatchData = await api.getModules(decodedModuleName, true);
        const exactModules = exactMatchData.modules || [];

        if (exactModules.length > 0) {
          console.log(`Found exact match for module: ${exactModules[0].name}`);
          setModule(exactModules[0]);

          // Get all modules for selector
          const allModulesData = await api.getModules();
          const modulesData = allModulesData.modules || [];
          setAllModules(
            modulesData.map((m: Module) => ({
              id: m.id,
              name: m.name,
              icon: m.icon,
            }))
          );

          // Fetch resources only for authenticated users
          if (isSignedIn) {
            const resourcesResponse = await fetch("/api/resources");
            if (resourcesResponse.status === 401) {
              // Handle unauthorized gracefully - user is not authenticated
              console.log("User is not authenticated for resources");
              setResources([]);
            } else if (resourcesResponse.ok) {
              const allResources = await resourcesResponse.json();
              // Filter resources for the current module
              const moduleResources = allResources.filter(
                (resource: Resource) => resource.moduleId === exactModules[0].id
              );
              setResources(moduleResources);
            } else {
              console.error(
                "Failed to fetch resources:",
                resourcesResponse.statusText
              );
              setResources([]);
            }
          } else {
            // No resources for anonymous users
            setResources([]);
          }
          return;
        }

        // If no exact match, proceed with the original logic
        console.log("No exact match found, trying fuzzy match");

        // Fetch all modules
        const allModulesData = await api.getModules();

        // Handle the new API response format where modules are in a nested 'modules' property
        const modulesData = allModulesData.modules || [];

        setAllModules(
          modulesData.map((m: Module) => ({
            id: m.id,
            name: m.name,
            icon: m.icon,
          }))
        );

        // First try exact match (case-insensitive)
        let moduleData = modulesData.find(
          (m: Module) =>
            m.name.toLowerCase() === decodedModuleName.toLowerCase()
        );

        // If not found with exact match, try a more flexible search
        if (!moduleData) {
          // Try matching with normalized strings (removing special chars)
          moduleData = modulesData.find((m: Module) => {
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
            const moduleQueryData = await api.getModules(decodedModuleName);

            // Handle the new API response format
            const responseData = moduleQueryData.modules || [];

            if (Array.isArray(responseData) && responseData.length > 0) {
              moduleData = responseData[0];
            } else {
              return notFound();
            }
          }
        }

        setModule(moduleData);

        // Fetch resources only for authenticated users
        if (isSignedIn) {
          const resourcesResponse = await fetch("/api/resources");
          if (resourcesResponse.status === 401) {
            // Handle unauthorized gracefully - user is not authenticated
            console.log("User is not authenticated for resources");
            setResources([]);
          } else if (resourcesResponse.ok) {
            const allResources = await resourcesResponse.json();
            // Filter resources for the current module
            const moduleResources = allResources.filter(
              (resource: Resource) => resource.moduleId === moduleData.id
            );
            setResources(moduleResources);
          } else {
            console.error(
              "Failed to fetch resources:",
              resourcesResponse.statusText
            );
            setResources([]);
          }
        } else {
          // No resources for anonymous users
          setResources([]);
        }
      } catch (error) {
        console.error("Error fetching module details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Check if we're running in the browser before accessing localStorage
    if (typeof window !== "undefined") {
      fetchModuleDetails();
    }
  }, [params.moduleName, isSignedIn]);

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

      // Check for anonymous sessionId
      const sessionId = localStorage.getItem("anonymous_session_id");

      let updateUrl = `/api/modules/${module.id}`;
      if (sessionId) {
        updateUrl = `/api/modules/${module.id}?sessionId=${sessionId}`;
      }

      await axios.put(updateUrl, {
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
      <div className="flex flex-col min-h-screen w-full">
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center">
              {/* Icon skeleton */}
              <Button
                variant="ghost"
                disabled
                className="text-xl cursor-default h-10 w-10 bg-gray-200 animate-pulse"
                aria-hidden
              ></Button>
              {/* Title skeleton */}
              <div className="h-8 w-48 bg-gray-200 animate-pulse rounded ml-2"></div>
            </div>

            {/* Action buttons skeleton */}
            <div className="flex items-center gap-1 pr-16">
              <Button
                variant="outline"
                disabled
                className="flex items-center gap-2 ml-1 mr-1"
                aria-hidden
              >
                <MessageSquare className="h-5 w-5" />
                <span>Go to Chat</span>
              </Button>
              <Button variant="ghost" disabled size="icon" aria-hidden>
                <Edit className="h-5 w-5" />
              </Button>

              <Button variant="ghost" disabled size="icon" aria-hidden>
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-6 px-3">
            {/* Description section skeleton */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <div className="text-muted-foreground p-4 rounded min-h-[158px] bg-gray-200 animate-pulse">
                <span className="opacity-0">Loading description...</span>
              </div>
            </div>

            <div className="my-6 h-px bg-gray-200"></div>

            {/* Resources section skeleton */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Resources</h2>
                <Button
                  variant="outline"
                  disabled
                  className="opacity-70"
                  aria-hidden
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>

              {/* Use ResourceTable with isLoading prop */}
              <ResourceTable
                resources={[]}
                modules={[]}
                onUpdate={() => {}}
                showModuleColumn={false}
                isLoading={true}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!module) {
    return notFound();
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center">
            {/* Module icon with popover for changing */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-xl cursor-pointer hover:bg-muted h-10 w-10"
                >
                  {module.icon}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="grid grid-cols-5 gap-1">
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
              <div className="flex items-center">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xl font-bold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleTitleSave();
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
                className="text-xl font-bold cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
                onClick={() => setIsEditingTitle(true)}
              >
                {module.name}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2 pr-16">
            <Button
              className="flex items-center gap-2"
              variant="outline"
              onClick={() =>
                router.push(`/${formatModuleNameForUrl(module.name)}/chat`)
              }
            >
              <MessageSquare className="h-5 w-5" />
              Go to Chat
            </Button>
            <ModuleActions moduleId={module.id} moduleName={module.name} />
          </div>
        </div>

        <div className="space-y-6 px-3">
          <div>
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            {/* Editable description */}
            {isEditingDescription ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="min-h-[158px]"
                  placeholder="Add a description..."
                  autoFocus
                  onKeyDown={(e) => {
                    // Save on Ctrl+Enter or Command+Enter
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      e.preventDefault();
                      handleDescriptionSave();
                    }
                  }}
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
                className="text-muted-foreground cursor-pointer hover:bg-muted/50 p-4 rounded min-h-[158px]"
                onClick={() => setIsEditingDescription(true)}
              >
                {module.description ||
                  "No description provided. Click to add one."}
              </p>
            )}
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Resources</h2>
              {isSignedIn && (
                <ResourceUploadButton variant="outline" moduleId={module.id} />
              )}
            </div>

            <ResourceTable
              resources={resources}
              modules={allModules}
              onUpdate={(updatedResource) => {
                if (updatedResource._deleted) {
                  // If resource was deleted, keep it in state but mark as deleted
                  setResources(
                    resources.map((r) =>
                      r.id === updatedResource.id ? { ...r, _deleted: true } : r
                    )
                  );
                } else if (updatedResource.moduleId !== module?.id) {
                  // If module changed, remove from this list
                  setResources(
                    resources.map((r) =>
                      r.id === updatedResource.id ? { ...r, _deleted: true } : r
                    )
                  );
                } else {
                  // Regular update
                  setResources(
                    resources.map((r) =>
                      r.id === updatedResource.id ? updatedResource : r
                    )
                  );
                }
              }}
              showModuleColumn={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Add this export to allow dynamic rendering
export const dynamic = "force-dynamic";
