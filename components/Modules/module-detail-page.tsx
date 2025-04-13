"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { notFound, useRouter } from "next/navigation";
import axios from "axios";
import { Check, MessageSquare, X, ChevronLeft } from "lucide-react";
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

import DeleteModule from "@/components/Modules/delete-module";
import { ResourceUploadButton } from "@/components/Resource/resource-upload-button";
import { ResourceTable } from "@/components/Resource/resource-table";
import { ResourceTableSkeleton } from "@/components/Resource/resource-table-skeleton";
import ModuleDetailsLoading from "@/app/modules/[moduleName]/loading";
import Header from "../Main/Header";

interface Module {
  id: string;
  name: string;
  context: string | null;
  icon: string;
  resourceCount: number;
  updatedAt: string;
}

interface Resource {
  id: string;
  title: string;
  type: string;
  fileUrl: string | null;
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
 * title, content, and its associated resources. It supports editing the module's title, content, and icon, with updates
 * triggering either a full page refresh (for name changes) or a component refresh (for content and icon changes).
 */
export default function ModuleDetailWrapper({
  moduleName,
}: {
  moduleName: string;
}) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [module, setModule] = useState<Module | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [allModules, setAllModules] = useState<
    { id: string; name: string; icon: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContext, setIsEditingContext] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContext, setEditContext] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Refs for detecting clicks outside
  const titleEditRef = useRef<HTMLDivElement>(null);
  const contextEditRef = useRef<HTMLDivElement>(null);

  // Validate props early
  useEffect(() => {
    if (!moduleName || typeof moduleName !== "string") {
      console.error("Invalid moduleName received", moduleName);
      setErrorMessage("Invalid module parameters");
      notFound();
    }
  }, [moduleName]);

  useEffect(() => {
    const fetchModuleDetails = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        // Check if moduleName exists and is not undefined
        if (
          !moduleName ||
          typeof moduleName !== "string" ||
          !moduleName.trim()
        ) {
          console.error(
            "Module name parameter is missing, empty, or invalid:",
            moduleName
          );
          setErrorMessage("Module name is missing or invalid");
          setIsLoading(false);
          return notFound();
        }

        // Log the raw module name from URL params
        console.log(`Raw module name from URL: "${moduleName}"`);

        // Decode the module name from URL parameters
        const decodedModuleName = decodeModuleSlug(moduleName);
        console.log(`Looking for module with name: "${decodedModuleName}"`);

        // Validate decoded module name
        if (!decodedModuleName || decodedModuleName === "unnamed-module") {
          console.error("Failed to decode module name properly");
          setErrorMessage("Invalid module name format");
          setIsLoading(false);
          return notFound();
        }

        // First try an exact match query
        console.log("Attempting exact match API query for:", decodedModuleName);
        try {
          const exactMatchData = await api.getModules(decodedModuleName, true);
          console.log("Exact match API response:", exactMatchData);
          const exactModules = exactMatchData.modules || [];

          if (exactModules.length > 0) {
            console.log(
              `Found exact match for module: ${exactModules[0].name}`
            );
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
              const resourcesResponse = await fetch(
                `/api/modules/${exactModules[0].id}/resources`
              );
              if (resourcesResponse.status === 401) {
                // Handle unauthorized gracefully - user is not authenticated
                console.log("User is not authenticated for resources");
                setResources([]);
              } else if (resourcesResponse.ok) {
                const responseData = await resourcesResponse.json();
                // Handle both response formats - direct array or { resources: [] }
                const moduleResources =
                  responseData.resources || responseData || [];
                console.log("Initial resources fetch:", moduleResources);
                setResources(
                  Array.isArray(moduleResources) ? moduleResources : []
                );
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

            // Set loading state to false after data is loaded
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error during exact match query:", error);
        }

        // If no exact match, proceed with the original logic
        console.log("No exact match found, trying fuzzy match");

        try {
          // Fetch all modules
          const allModulesData = await api.getModules();
          console.log("All modules API response:", allModulesData);

          // Handle the new API response format where modules are in a nested 'modules' property
          const modulesData = allModulesData.modules || [];

          setAllModules(
            modulesData.map((m: Module) => ({
              id: m.id,
              name: m.name,
              icon: m.icon,
            }))
          );

          if (modulesData.length === 0) {
            console.error("No modules found in database");
            setErrorMessage("No modules found");
            setIsLoading(false);
            return notFound();
          }

          // First try exact match (case-insensitive)
          let moduleData = modulesData.find(
            (m: Module) =>
              m.name.toLowerCase() === decodedModuleName.toLowerCase()
          );

          if (moduleData) {
            console.log("Found case-insensitive match:", moduleData.name);
          }

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
              const isMatch = normalizedDbName === normalizedSearchName;
              if (isMatch) {
                console.log("Found normalized match:", m.name);
              }
              return isMatch;
            });

            // If still not found, try API query
            if (!moduleData) {
              try {
                // If not found by case-insensitive match, try direct API query
                console.log(
                  "Attempting fuzzy API query for:",
                  decodedModuleName
                );
                const moduleQueryData = await api.getModules(decodedModuleName);
                console.log("Fuzzy match API response:", moduleQueryData);

                // Handle the new API response format
                const responseData = moduleQueryData.modules || [];

                if (Array.isArray(responseData) && responseData.length > 0) {
                  moduleData = responseData[0];
                  console.log("Found module via API query:", moduleData.name);
                } else {
                  console.error("No modules found via API query");
                  setErrorMessage("Module not found");
                  setIsLoading(false);
                  return notFound();
                }
              } catch (queryError) {
                console.error("Error during fuzzy API query:", queryError);
              }
            }
          }

          if (!moduleData) {
            console.error("Module not found after all search attempts");
            setErrorMessage("Module not found");
            setIsLoading(false);
            return notFound();
          }

          setModule(moduleData);

          // Fetch resources only for authenticated users
          if (isSignedIn) {
            const resourceApiUrl = `/api/modules/${moduleData.id}/resources`;
            console.log(
              `Fetching resources from: ${resourceApiUrl}, moduleId=${moduleData.id}`
            );

            const resourcesResponse = await fetch(resourceApiUrl);
            if (resourcesResponse.status === 401) {
              // Handle unauthorized gracefully - user is not authenticated
              console.log("User is not authenticated for resources");
              setResources([]);
            } else if (resourcesResponse.ok) {
              const responseData = await resourcesResponse.json();
              // Handle both response formats - direct array or { resources: [] }
              const moduleResources =
                responseData.resources || responseData || [];
              console.log(
                `Received ${moduleResources.length} resources from ${resourceApiUrl}`
              );
              console.log("Fuzzy match resources fetch:", moduleResources);

              // Double-check if all resources are for this module
              if (moduleResources.length > 0) {
                const wrongModuleResources = moduleResources.filter(
                  (r: Resource) => r.moduleId !== moduleData.id
                );
                if (wrongModuleResources.length > 0) {
                  console.error(
                    `ERROR: ${wrongModuleResources.length}/${moduleResources.length} resources are for different modules!`
                  );
                }
              }

              setResources(
                Array.isArray(moduleResources) ? moduleResources : []
              );
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
      } catch (error) {
        console.error("Error fetching module details:", error);
      }
    };

    // Check if we're running in the browser before accessing localStorage
    if (typeof window !== "undefined") {
      fetchModuleDetails();
    }
  }, [moduleName, isSignedIn]);

  // Listen for resource events to refresh the resource list
  useEffect(() => {
    if (!isSignedIn || !module) return;

    // Event handlers for resource events
    const handleResourceCreated = (
      event: CustomEvent<{ id: string; moduleId: string }>
    ) => {
      const resourceData = event.detail;
      console.log(`Resource event received with data:`, resourceData);
      console.log(`Current module ID: ${module.id}`);

      // Only refresh resources if this event is for the current module
      if (resourceData && resourceData.moduleId === module.id) {
        console.log(
          `Resource created event detected for module ${module.id}, refreshing resources`
        );
        const resourceApiUrl = `/api/modules/${module.id}/resources`;
        console.log(`Fetching from: ${resourceApiUrl}`);

        fetch(resourceApiUrl)
          .then((response) => {
            console.log(`Response status: ${response.status}`);
            if (!response.ok) return [];
            return response.json();
          })
          .then((responseData) => {
            // Handle both response formats - direct array or { resources: [] }
            console.log(`Raw response data:`, responseData);
            const moduleResources =
              responseData.resources || responseData || [];
            console.log(`Processed resources data:`, moduleResources);
            console.log(
              `Setting ${moduleResources.length} resources for module ${module.id}`
            );
            setResources(Array.isArray(moduleResources) ? moduleResources : []);
          })
          .catch((error) => {
            console.error(
              "Error refreshing resources after resource creation:",
              error
            );
            setResources([]);
          });
      } else {
        console.log(
          `Ignoring resource event for different module: ${resourceData?.moduleId}`
        );
      }
    };

    // Use the same handler for updated and deleted resources
    const handleResourceUpdated = handleResourceCreated;
    const handleResourceDeleted = handleResourceCreated;

    // Add event listeners for SSE events with CustomEvent type casting
    window.addEventListener(
      "resource.created",
      handleResourceCreated as EventListener
    );
    window.addEventListener(
      "resource.updated",
      handleResourceUpdated as EventListener
    );
    window.addEventListener(
      "resource.deleted",
      handleResourceDeleted as EventListener
    );

    return () => {
      // Cleanup on unmount
      window.removeEventListener(
        "resource.created",
        handleResourceCreated as EventListener
      );
      window.removeEventListener(
        "resource.updated",
        handleResourceUpdated as EventListener
      );
      window.removeEventListener(
        "resource.deleted",
        handleResourceDeleted as EventListener
      );
    };
  }, [isSignedIn, module]);

  // Initialize title and content when module data is loaded
  useEffect(() => {
    if (module) {
      setEditTitle(module.name || "");
      setEditContext(module.context || "");

      // Log successful module load
      console.log("Module data loaded successfully:", module.name);

      // Update document title
      document.title = `${module.name} | Study Chat`;
    }
  }, [module]);

  // Format module name for URL
  const formatModuleNameForUrl = (name: string) => {
    return encodeModuleSlug(name);
  };

  // Save module updates
  const saveModuleUpdate = async (updates: {
    name?: string;
    context?: string;
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
        context: updates.context !== undefined ? updates.context : module.context,
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
        // For content and icon updates, just use router.refresh()
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
      setIsEditingContext(false);
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

  // Handle content update
  const handleContextSave = () => {
    saveModuleUpdate({ context: editContext });
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

  const cancelContextEdit = useCallback(() => {
    setEditContext(module?.context || "");
    setIsEditingContext(false);
  }, [module, setEditContext, setIsEditingContext]);

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

      // Handle content edit click outside
      if (
        isEditingContext &&
        contextEditRef.current &&
        !contextEditRef.current.contains(event.target as Node)
      ) {
        cancelContextEdit();
      }
    }

    // Add event listener when editing is active
    if (isEditingTitle || isEditingContext) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditingTitle, isEditingContext, cancelContextEdit, cancelTitleEdit]);

  // Add retry function for cases where module might not load on first try
  const handleRetry = useCallback(() => {
    if (retryCount < 3) {
      // Limit retries to prevent infinite loops
      setRetryCount((prev) => prev + 1);
      setIsLoading(true);
      setErrorMessage(null);
      router.refresh(); // Refresh the page to try loading again
    } else {
      // If we've tried too many times, show a more permanent error
      setErrorMessage(
        "Unable to load module after multiple attempts. Please go back and try again."
      );
    }
  }, [retryCount, router]);

  // Render error state with retry button
  if (errorMessage && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-4">
        <h2 className="text-xl font-semibold mb-4">Error Loading Module</h2>
        <p className="text-muted-foreground mb-6 text-center">{errorMessage}</p>
        <div className="flex gap-4">
          <Button onClick={() => router.push("/modules")}>
            Back to Modules
          </Button>
          {retryCount < 3 && (
            <Button variant="outline" onClick={handleRetry}>
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center pl-4">
            {/* Back button */}
            <Button
              variant="ghost"
              size="icon"
              className="add-margin-for-headers"
              onClick={() => router.back()}
              aria-label="Go back"
            >
              <ChevronLeft className="h-10 w-10" />
            </Button>

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
                      className="h-10 w-10 text-xl"
                      onClick={() => handleIconChange(icon)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleIconChange(icon);
                        }
                      }}
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Editable title */}
            {isEditingTitle ? (
              <div className="flex items-center flex-shrink" ref={titleEditRef}>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="min-w-0"
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
                className="text-xl cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
                ref={titleEditRef}
                onClick={() => setIsEditingTitle(true)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setIsEditingTitle(true);
                  }
                }}
              >
                <span className="flex-shrink">{module.name}</span>
              </h1>
            )}
          </div>
          <div className="flex items-center gap-3 mr-24">
            <Button
              className="flex items-center gap-2"
              variant="outline"
              onClick={() =>
                router.push(`/${formatModuleNameForUrl(module.name)}/chat`)
              }
            >
              <MessageSquare className="h-5 w-5" />
              <span className="hidden sm:inline">Go to Chat</span>
            </Button>
            <DeleteModule moduleId={module.id} moduleName={module.name} />
          </div>
          <Header />
        </div>

        <div className="space-y-13 px-3">
          <div className="px-4">
            <h2 className="text-lg mb-2">Context</h2>
            {/* Editable content */}
            {isEditingContext ? (
              <div className="flex flex-col gap-2" ref={contextEditRef}>
                <Textarea
                  value={editContext}
                  onChange={(e) => setEditContext(e.target.value)}
                  className="min-h-[158px] mr-6 p-4"
                  placeholder="Enter your context here..."
                  tabIndex={0}
                  autoFocus
                  onKeyDown={(e) => {
                    // Save on Enter
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleContextSave();
                    }
                    // Save on Ctrl+Enter or Command+Enter
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      e.preventDefault();
                      handleContextSave();
                    }
                    // Cancel on Escape
                    if (e.key === "Escape") {
                      e.preventDefault();
                      cancelContextEdit();
                    }
                  }}
                />
                <div className="flex justify-end gap-2 -mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelContextEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleContextSave}
                    disabled={isSaving}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p
                className="text-muted-foreground cursor-pointer hover:bg-muted/50 p-4 mr-4 mb-12 rounded min-h-[158px]"
                onClick={() => setIsEditingContext(true)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setIsEditingContext(true);
                  }
                }}
              >
                {module.context || "Enter your context here..."}
              </p>
            )}
          </div>

          <Separator className="my-6 mx-4" />

          <div className="space-y-4 px-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg">Resources</h2>
              {isSignedIn && !!resources.length && (
                <ResourceUploadButton variant="outline" moduleId={module.id} />
              )}
            </div>

            <div className="min-h-[300px]">
              {isLoading ? (
                <ResourceTableSkeleton showModuleColumn={false} />
              ) : resources.length === 0 && isSignedIn ? (
                <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
                  <h3 className="font-medium">
                    Access your knowledge base and upload your own resources.
                  </h3>
                  <ResourceUploadButton
                    variant="outline"
                    className="text-secondary-foreground"
                    moduleId={module.id}
                  />
                </div>
              ) : (
                <ResourceTable
                  resources={Array.isArray(resources) ? resources : []}
                  modules={allModules}
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
                          r.id === updatedResource.id ? updatedResource : r
                        )
                      );
                    }
                  }}
                  showModuleColumn={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
