import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { decodeModuleSlug, encodeModuleSlug } from "@/lib/utils";
import { Module, Resource } from "../module-detail-page";

/**
 * Custom hook to handle all module data fetching and state management
 */
export function useModuleData(
  moduleName: string,
  prefetchedResources: Resource[] = [],
  isSignedIn: boolean | undefined
) {
  const [module, setModule] = useState<Module | null>(null);
  const [resources, setResources] = useState<Resource[]>(prefetchedResources);
  const [allModules, setAllModules] = useState<
    { id: string; name: string; icon: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResourcesLoading, setIsResourcesLoading] = useState(
    !prefetchedResources.length
  );
  const [showResourceUI, setShowResourceUI] = useState(
    !!prefetchedResources.length
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Validate props early
  useEffect(() => {
    if (!moduleName || typeof moduleName !== "string") {
      console.error("Invalid moduleName received", moduleName);
      setErrorMessage("Invalid module parameters");
      notFound();
    }
  }, [moduleName]);

  // Helper function to fetch resources for a module
  const fetchModuleResources = useCallback(
    async (moduleId: string, hasPrefetchedResources: boolean) => {
      if (!isSignedIn || hasPrefetchedResources) {
        if (hasPrefetchedResources) {
          setShowResourceUI(true);
        }
        return;
      }

      try {
        const resourcesResponse = await fetch(
          `/api/modules/${moduleId}/resources`
        );

        if (resourcesResponse.status === 401) {
          setResources([]);
        } else if (resourcesResponse.ok) {
          const responseData = await resourcesResponse.json();
          const moduleResources = responseData.resources || [];
          setResources(Array.isArray(moduleResources) ? moduleResources : []);
          setShowResourceUI(true);
        } else {
          setResources([]);
        }
      } catch (error) {
        console.error("Error fetching resources:", error);
        setResources([]);
      }
    },
    [isSignedIn, setResources, setShowResourceUI]
  );

  // Helper function to fetch all modules
  const fetchAllModules = useCallback(async () => {
    try {
      const allModulesData = await api.getModules();
      const modulesData = allModulesData.modules || [];
      setAllModules(
        modulesData.map((m: Module) => ({
          id: m.id,
          name: m.name,
          icon: m.icon,
        }))
      );
      return modulesData;
    } catch (error) {
      console.error("Error fetching all modules:", error);
      return [];
    }
  }, [setAllModules]);

  // Helper function to try exact module match
  const tryExactModuleMatch = useCallback(
    async (decodedModuleName: string, hasPrefetchedResources: boolean) => {
      try {
        const exactMatchData = await api.getModules(decodedModuleName, true);
        const exactModules = exactMatchData.modules || [];

        if (exactModules.length > 0) {
          setModule(exactModules[0]);

          // Get all modules for selector
          await fetchAllModules();

          // Fetch resources if needed
          await fetchModuleResources(
            exactModules[0].id,
            hasPrefetchedResources
          );

          return true;
        }
      } catch (error) {
        console.error("Error during exact match query:", error);
      }
      return false;
    },
    [fetchAllModules, fetchModuleResources, setModule]
  );

  // Helper function to try fuzzy module match
  const tryFuzzyModuleMatch = useCallback(
    async (decodedModuleName: string, hasPrefetchedResources: boolean) => {
      try {
        // Fetch all modules
        const modulesData = await fetchAllModules();

        if (modulesData.length === 0) {
          setErrorMessage("No modules found");
          return false;
        }

        // Try different matching strategies
        let moduleData = modulesData.find(
          (m: Module) =>
            m.name.toLowerCase() === decodedModuleName.toLowerCase()
        );

        if (!moduleData) {
          // Try normalized string matching
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
            try {
              const moduleQueryData = await api.getModules(decodedModuleName);
              const responseData = moduleQueryData.modules || [];

              if (Array.isArray(responseData) && responseData.length > 0) {
                moduleData = responseData[0];
              } else {
                return false;
              }
            } catch (queryError) {
              console.error("Error during fuzzy API query:", queryError);
              return false;
            }
          }
        }

        if (!moduleData) {
          return false;
        }

        setModule(moduleData);

        // Fetch resources if needed
        await fetchModuleResources(moduleData.id, hasPrefetchedResources);

        return true;
      } catch (error) {
        console.error("Error in fuzzy matching:", error);
        return false;
      }
    },
    [fetchAllModules, fetchModuleResources, setModule, setErrorMessage]
  );

  // Main data fetching effect
  useEffect(() => {
    const fetchModuleDetails = async () => {
      try {
        setIsLoading(true);
        // Only set resources loading if we don't have prefetched resources
        if (!prefetchedResources.length) {
          setIsResourcesLoading(true);
        }
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
          setIsResourcesLoading(false);
          return notFound();
        }

        // Decode the module name from URL parameters
        const decodedModuleName = decodeModuleSlug(moduleName);
        console.log(`Looking for module with name: "${decodedModuleName}"`);

        // Validate decoded module name
        if (!decodedModuleName || decodedModuleName === "unnamed-module") {
          console.error("Failed to decode module name properly");
          setErrorMessage("Invalid module name format");
          setIsLoading(false);
          setIsResourcesLoading(false);
          return notFound();
        }

        // Check if we already have prefetched resources
        const hasPrefetchedResources = prefetchedResources.length > 0;

        // First try an exact match, then fallback to fuzzy matching
        const foundExactMatch = await tryExactModuleMatch(
          decodedModuleName,
          hasPrefetchedResources
        );

        if (!foundExactMatch) {
          const foundFuzzyMatch = await tryFuzzyModuleMatch(
            decodedModuleName,
            hasPrefetchedResources
          );

          if (!foundFuzzyMatch) {
            setErrorMessage("Module not found");
            notFound();
          }
        }
      } catch (error) {
        console.error("Error fetching module details:", error);
        setErrorMessage("Error loading module");
      } finally {
        setIsLoading(false);
        setIsResourcesLoading(false);
      }
    };

    // Check if we're running in the browser before accessing localStorage
    if (typeof window !== "undefined") {
      fetchModuleDetails();
    }
  }, [
    moduleName,
    isSignedIn,
    tryExactModuleMatch,
    tryFuzzyModuleMatch,
    prefetchedResources,
  ]);

  // Listen for resource events to refresh the resource list
  useEffect(() => {
    if (!isSignedIn || !module) return;

    // Event handlers for resource events
    const handleResourceCreated = (
      event: CustomEvent<{ id: string; moduleId: string }>
    ) => {
      const resourceData = event.detail;

      // Only refresh resources if this event is for the current module
      if (resourceData && resourceData.moduleId === module.id) {
        const resourceApiUrl = `/api/modules/${module.id}/resources`;

        fetch(resourceApiUrl)
          .then((response) => {
            if (!response.ok) return [];
            return response.json();
          })
          .then((responseData) => {
            // Handle both response formats - direct array or { resources: [] }
            const moduleResources =
              responseData.resources || responseData || [];
            setResources(Array.isArray(moduleResources) ? moduleResources : []);
          })
          .catch((error) => {
            console.error(
              "Error refreshing resources after resource event:",
              error
            );
            setResources([]);
          });
      }
    };

    // Use the same handler for updated and deleted resources
    const handleResourceUpdated = handleResourceCreated;
    const handleResourceDeleted = handleResourceCreated;

    // Add event listeners
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

  // Set document title when module data is loaded
  useEffect(() => {
    if (module) {
      document.title = `${module.name} | Study Chat`;
    }
  }, [module]);

  // Effect to control the showing of resource UI with a delay
  useEffect(() => {
    // If resources are already loaded (via prefetch), no need for delay
    if (prefetchedResources.length > 0 && !isResourcesLoading) {
      setShowResourceUI(true);
      return;
    }

    if (!isResourcesLoading) {
      // Wait for a short delay before showing any resource UI
      const timer = setTimeout(() => {
        setShowResourceUI(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowResourceUI(false);
    }
  }, [isResourcesLoading, prefetchedResources.length]);

  // Save module updates
  const updateModule = async (updates: {
    name?: string | undefined;
    context?: string | undefined;
    icon?: string | undefined;
  }): Promise<
    | {
        success: boolean;
        requiresRefresh?: boolean;
        formattedName?: string;
      }
    | undefined
  > => {
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
        context:
          updates.context !== undefined ? updates.context : module.context,
        icon: updates.icon !== undefined ? updates.icon : module.icon,
      };

      // Make the API request
      await axios.put(updateUrl, updateData);

      toast.success("Module updated");

      // Check if name was changed using strict boolean check
      const nameChanged = updates.name
        ? updates.name !== originalModule.name
        : false;

      return {
        success: true,
        requiresRefresh: nameChanged,
        formattedName: updates.name
          ? encodeModuleSlug(updates.name)
          : undefined,
      };
    } catch (error) {
      console.error("Error updating module:", error);

      // Revert the optimistic update on error
      setModule(originalModule);
      toast.error("Failed to update module");

      return { success: false };
    } finally {
      setIsSaving(false);
    }
  };

  return {
    module,
    resources,
    allModules,
    isLoading,
    isResourcesLoading,
    showResourceUI,
    errorMessage,
    isSaving,
    setModule,
    setResources,
    updateModule,
  };
}
