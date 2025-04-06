import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

// Define interface for the resource data
interface Resource {
  id: string;
  title: string;
  type: string;
  fileUrl: string | null;
  createdAt: string;
  updatedAt?: string;
  moduleId: string;
  moduleName?: string | null; // UI helper, not in schema
  userId?: string | null;
  fileSize?: number;
  _deleted?: boolean; // UI helper
}

// Define interface for module data used in resources
interface ResourceModule {
  id: string;
  name: string;
  icon: string;
}

export function useResources(isSignedIn: boolean, searchQuery: string) {
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [resourceModules, setResourceModules] = useState<ResourceModule[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  // Helper function to filter resources based on search query
  const filterResources = useCallback(
    (resources: Resource[], query: string) => {
      if (!query) {
        setFilteredResources(resources);
      } else {
        const filtered = resources.filter(
          (resource) =>
            resource.title.toLowerCase().includes(query.toLowerCase()) ||
            (resource.moduleName &&
              resource.moduleName.toLowerCase().includes(query.toLowerCase()))
        );
        setFilteredResources(filtered);
      }
    },
    []
  );

  // Fetch resources function
  const fetchResources = useCallback(async () => {
    try {
      setResourcesLoading(true);

      // Fetch all modules for the selector
      const modulesData = await api.getModules();
      const modulesList = modulesData.modules || [];
      setResourceModules(
        modulesList.map((m: any) => ({
          id: m.id,
          name: m.name,
          icon: m.icon,
        }))
      );

      // Only attempt to fetch resources if user is signed in
      if (isSignedIn) {
        // Fetch resources - these require authentication
        const resourcesResponse = await fetch("/api/resources");

        if (resourcesResponse.status === 401) {
          // Handle unauthorized gracefully - user is not logged in
          console.log("User is not authenticated for resources");
          setAllResources([]);
          setFilteredResources([]);
        } else if (!resourcesResponse.ok) {
          throw new Error(
            `Failed to fetch resources: ${resourcesResponse.statusText}`
          );
        } else {
          const resourcesData = await resourcesResponse.json();
          setAllResources(resourcesData);

          // Initialize filtered resources
          filterResources(resourcesData, searchQuery);
        }
      } else {
        // User is not signed in, don't try to fetch resources
        setAllResources([]);
        setFilteredResources([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Set resources to empty array on error
      setAllResources([]);
      setFilteredResources([]);
    } finally {
      setResourcesLoading(false);
    }
  }, [isSignedIn, searchQuery, filterResources]);

  // Update filtered resources when search query changes
  useEffect(() => {
    filterResources(allResources, searchQuery);
  }, [searchQuery, allResources, filterResources]);

  // Fetch resources when component mounts or dependencies change
  useEffect(() => {
    if (isSignedIn) {
      fetchResources();
    }
  }, [fetchResources, isSignedIn]);

  // Handle resource updates (for edits and deletions)
  const handleResourceUpdate = (updatedResource: Resource) => {
    if (updatedResource._deleted) {
      // If resource was deleted, mark as deleted in the UI
      setAllResources((resources) =>
        resources.map((r) =>
          r.id === updatedResource.id ? { ...r, _deleted: true } : r
        )
      );
      setFilteredResources((resources) =>
        resources.map((r) =>
          r.id === updatedResource.id ? { ...r, _deleted: true } : r
        )
      );
    } else {
      // Regular update
      setAllResources((resources) =>
        resources.map((r) =>
          r.id === updatedResource.id ? updatedResource : r
        )
      );
      setFilteredResources((resources) =>
        resources.map((r) =>
          r.id === updatedResource.id ? updatedResource : r
        )
      );
    }
  };

  // Listen for resource events using DOM events
  useEffect(() => {
    if (!isSignedIn) return;

    // Event handler for resource changes (created, updated, deleted)
    const handleResourceChanged = async () => {
      try {
        // Fetch all modules for the selector without showing loading state
        const modulesData = await api.getModules();
        const modulesList = modulesData.modules || [];
        setResourceModules(
          modulesList.map((m: any) => ({
            id: m.id,
            name: m.name,
            icon: m.icon,
          }))
        );

        // Fetch resources without showing loading state
        const resourcesResponse = await fetch("/api/resources");

        if (resourcesResponse.ok) {
          const resourcesData = await resourcesResponse.json();
          // Ensure we're not filtering out any resources
          setAllResources(resourcesData);
          filterResources(resourcesData, searchQuery);
        }
      } catch (error) {
        console.error("Error refreshing resources:", error);
      }
    };

    // Add event listeners
    window.addEventListener("resource.created", handleResourceChanged);
    window.addEventListener("resource.updated", handleResourceChanged);
    window.addEventListener("resource.deleted", handleResourceChanged);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resource.created", handleResourceChanged);
      window.removeEventListener("resource.updated", handleResourceChanged);
      window.removeEventListener("resource.deleted", handleResourceChanged);
    };
  }, [isSignedIn, filterResources, searchQuery]);

  return {
    allResources,
    filteredResources,
    resourceModules,
    resourcesLoading,
    fetchResources,
    handleResourceUpdate,
  };
}
