"use client";

import React, { Suspense, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Search } from "lucide-react";
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
import { encodeModuleSlug } from "@/lib/utils";
import { ResourceUploadButton } from "@/components/Resource/resource-upload-button";
import { useSession } from "@/context/session-context";
import { api } from "@/lib/api";
import { ResourceTable } from "@/components/Resource/resource-table";
import { ResourceTableSkeleton } from "@/components/Resource/resource-table-skeleton";
import { toast } from "sonner";
import { useResources } from "@/lib/hooks/useResources";

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

/**
 * Renders the modules page content with tabs for modules and resources.
 *
 * This component fetches and displays modules based on an optional search query, using URL parameters to
 * determine the active tab, whether to open the resource upload dialog, and a preselected module for uploading resources.
 * It checks for user authentication, displaying a sign-in prompt if the user is unauthorized, and conditionally renders
 * either a filtered list of modules or a resource table through a nested component.
 *
 * @param searchParams - URL query parameters that set the initial UI state (e.g., active tab, resource upload dialog visibility, and preselected module).
 */
export default function ModulesPageContent({
  searchParams,
}: {
  searchParams: URLSearchParams;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const { sessionId, isLoading: sessionLoading } = useSession();
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

  // Use the custom hook for resource state management
  const {
    filteredResources,
    resourceModules,
    resourcesLoading,
    handleResourceUpdate,
  } = useResources(!!isSignedIn, searchQuery);

  // This effect fetches the modules data from the API
  useEffect(() => {
    async function fetchModules() {
      try {
        setIsLoading(true);

        // Artificial delay to ensure loading state is visible
        await new Promise((resolve) => setTimeout(resolve, 500));

        const data = await api.getModules(searchQuery || undefined);

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

    if (isLoaded && !sessionLoading) {
      fetchModules();
    }
  }, [isSignedIn, isLoaded, sessionId, sessionLoading, searchQuery]);

  // Listen for module creation events to refresh the module list
  useEffect(() => {
    const handleModuleCreated = () => {
      // Refresh modules when a new module is created
      if (isLoaded && !sessionLoading) {
        api
          .getModules(searchQuery || undefined)
          .then((data) => {
            const modulesList = data.modules || [];
            setModules(modulesList);
            setFilteredModules(modulesList);
            // If we're on the modules tab, show a toast notification
            if (activeTab === "modules") {
              toast.success("New module added");
            }
          })
          .catch((error) => {
            console.error("Error refreshing modules:", error);
          });
      }
    };

    // Listen for the module-created event
    window.addEventListener("module-created", handleModuleCreated);

    return () => {
      window.removeEventListener("module-created", handleModuleCreated);
    };
  }, [isLoaded, sessionLoading, searchQuery, activeTab]);

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

  if (!isLoaded || sessionLoading) {
    return null;
  }

  // Check if the user can access modules (signed in or has sessionId)
  const canAccessModules = isSignedIn || !!sessionId;

  if (!canAccessModules) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex-1 space-y-4">
          <div className="flex p-5 items-center">
            <h1 className="font-bold text-xl">Categories</h1>
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

  // Updated ResourcesWrapper using the resources from our custom hook
  function ResourcesWrapper() {
    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          {searchQuery && (
            <p className="text-muted-foreground">
              Showing results for: &quot;{searchQuery}&quot;
            </p>
          )}
        </div>

        {/* Use the ResourceTable component */}
        <div className="min-h-[300px]">
          {resourcesLoading ? (
            <ResourceTableSkeleton showModuleColumn={true} />
          ) : filteredResources.length === 0 && isSignedIn ? (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
              <h3 className="font-medium">
                Access your knowledge base and upload your own resources.
              </h3>
            </div>
          ) : isSignedIn ? (
            <ResourceTable
              resources={filteredResources.map((resource) => ({
                ...resource,
                fileSize: resource.fileSize ?? undefined,
              }))}
              modules={resourceModules}
              onUpdate={handleResourceUpdate}
              showModuleColumn={true}
            />
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
              <h3 className="font-medium">
                You need to be signed in to view and upload resources.
              </h3>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Return the main UI
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between px-3 py-3.5">
          <h1 className="font-bold text-xl">Categories</h1>
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
                <ModuleOperations sessionId={sessionId} />
              </Suspense>
            ) : isSignedIn ? (
              <ResourceUploadButton
                variant="outline"
                moduleId={preselectedModuleId || undefined}
                initialOpen={openResourceUpload}
              />
            ) : null}
          </div>

          <TabsContent value="modules" className="mt-2">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* No skeleton cards as requested */}
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
                {filteredModules.map((module) => {
                  // Make sure module name exists and is not empty before encoding
                  if (!module.name) {
                    console.error("Module name is missing", module);
                    return null;
                  }

                  const moduleSlug = encodeModuleSlug(module.name);
                  console.log(
                    `Creating link for "${module.name}" → "${moduleSlug}"`
                  );

                  // Ensure moduleSlug is not empty
                  if (!moduleSlug) {
                    console.error(
                      "Failed to encode module slug for",
                      module.name
                    );
                    return null;
                  }

                  return (
                    <Link
                      href={`/modules/${moduleSlug}`}
                      key={module.id || module.name}
                      prefetch={true}
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
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resources" className="mt-2">
            <ResourcesWrapper />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
