"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { notFound, useRouter } from "next/navigation";
import axios from "axios";
import { Check, MessageSquare, X } from "lucide-react";
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

import ModuleActions from "@/components/Modules/module-actions";
import { ResourceUploadButton } from "@/components/Resource/resource-upload-button";
import { ResourceTable } from "@/components/Resource/resource-table";
import ModuleDetailsLoading from "@/app/modules/[moduleName]/loading";

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
 * Client component that handles the module detail functionality.
 *
 * This component fetches module data based on a module name provided via URL parameters and displays the module's icon,
 * title, description, and its associated resources. It supports editing the module's title, description, and icon, with updates
 * triggering either a full page refresh (for name changes) or a component refresh (for description and icon changes).
 */
export default function ModuleDetailWrapper({
  params,
}: {
  params: { moduleName: string };
}) {
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

  // Refs for detecting clicks outside
  const titleEditRef = useRef<HTMLDivElement>(null);
  const descriptionEditRef = useRef<HTMLDivElement>(null);

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

    // Store the original module state for rollback if needed
    const originalModule = { ...module };

    try {
      setIsSaving(true);

      // Apply optimistic update immediately
      setModule({
        ...module,
        ...updates,
      });

      // Check for anonymous sessionId
      const sessionId = localStorage.getItem("anonymous_session_id");

      let updateUrl = `/api/modules/${module.id}`;
      if (sessionId) {
        updateUrl = `/api/modules/${module.id}?sessionId=${sessionId}`;
      }

      // Prepare the update data
      const updateData = {
        name: updates.name !== undefined ? updates.name : module.name,
        description:
          updates.description !== undefined
            ? updates.description
            : module.description,
        icon: updates.icon !== undefined ? updates.icon : module.icon,
      };

      // Make the API request
      await axios.put(updateUrl, updateData);

      toast.success("Module updated");

      // Only use a full page refresh for name changes
      if (updates.name && updates.name !== originalModule.name) {
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

      // Revert the optimistic update on error
      if (module) {
        setModule(originalModule);
      }

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
  const cancelTitleEdit = useCallback(() => {
    setEditTitle(module?.name || "");
    setIsEditingTitle(false);
  }, [module, setEditTitle, setIsEditingTitle]);

  const cancelDescriptionEdit = useCallback(() => {
    setEditDescription(module?.description || "");
    setIsEditingDescription(false);
  }, [module, setEditDescription, setIsEditingDescription]);

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Handle title edit click outside
      if (
        isEditingTitle &&
        titleEditRef.current &&
        !titleEditRef.current.contains(event.target as Node)
      ) {
        cancelTitleEdit();
      }

      // Handle description edit click outside
      if (
        isEditingDescription &&
        descriptionEditRef.current &&
        !descriptionEditRef.current.contains(event.target as Node)
      ) {
        cancelDescriptionEdit();
      }
    }

    // Add event listener when editing is active
    if (isEditingTitle || isEditingDescription) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    isEditingTitle,
    isEditingDescription,
    cancelDescriptionEdit,
    cancelTitleEdit,
  ]);

  // This lets us manage the loading state ourselves
  if (isLoading) {
    return <ModuleDetailsLoading />;
  }

  // Return null (invisible component) if module isn't loaded
  if (!module) {
    return null;
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
                  aria-label="Module icon picker"
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
              <div className="flex items-center" ref={titleEditRef}>
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
                    if (e.key === "Escape") {
                      e.preventDefault();
                      cancelTitleEdit();
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
              <div className="flex flex-col gap-2" ref={descriptionEditRef}>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="min-h-[158px]"
                  placeholder="Add a description..."
                  autoFocus
                  onKeyDown={(e) => {
                    // Save on Enter
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleDescriptionSave();
                    }
                    // Save on Ctrl+Enter or Command+Enter
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      e.preventDefault();
                      handleDescriptionSave();
                    }
                    // Cancel on Escape
                    if (e.key === "Escape") {
                      e.preventDefault();
                      cancelDescriptionEdit();
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
