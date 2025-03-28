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
import { ResourceUploadButton } from "@/components/ResourceUploadButton";
import { useSession } from "@/context/SessionContext";
import { api } from "@/lib/api";
import { ResourceTable } from "@/components/ResourceTable";

// Import the dedicated search params component
import { SearchParamsReader } from "./search-params";

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
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between px-3 py-4">
          <div className="h-6 w-36 bg-gray-200 animate-pulse rounded"></div>
        </div>

        {/* Tabs skeleton */}
        <div className="px-3">
          <div className="grid w-full max-w-md grid-cols-2 h-9 bg-gray-100 rounded-md">
            <div className="m-1 h-7 w-auto bg-gray-200 animate-pulse rounded-sm"></div>
            <div className="m-1 h-7 w-auto bg-gray-100 rounded-sm"></div>
          </div>

          {/* Search bar and button skeleton */}
          <div className="relative flex items-center gap-2 mt-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <div className="h-9 w-full bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className="h-9 w-40 bg-gray-200 animate-pulse rounded"></div>
          </div>

          {/* Module cards skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
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

// Create a component that receives searchParams as props
function ModulesPageContent({
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

  // This effect fetches the modules data from the API
  useEffect(() => {
    async function fetchModules() {
      try {
        setIsLoading(true);

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
    return <ModulesLoading />;
  }

  // Check if the user can access modules (signed in or has sessionId)
  const canAccessModules = isSignedIn || !!sessionId;

  if (!canAccessModules) {
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
    const { sessionId } = useSession();
    const { isSignedIn } = useAuth();

    // Fetch resources from the API
    useEffect(() => {
      async function fetchData() {
        try {
          setResourcesLoading(true);

          // Fetch all modules for the selector
          const modulesData = await api.getModules();
          const modulesList = modulesData.modules || [];
          setModules(
            modulesList.map((m: Module) => ({
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
              setFilteredResources([]);
            } else if (!resourcesResponse.ok) {
              throw new Error(
                `Failed to fetch resources: ${resourcesResponse.statusText}`
              );
            } else {
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
            }
          } else {
            // User is not signed in, don't try to fetch resources
            setFilteredResources([]);
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
    }, [searchQuery, isSignedIn, sessionId]);

    const handleResourceUpdate = (updatedResource: Resource) => {
      if (updatedResource._deleted) {
        // If resource was deleted, mark as deleted in the UI
        setFilteredResources((resources) =>
          resources.map((r) =>
            r.id === updatedResource.id ? { ...r, _deleted: true } : r
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
    };

    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          {searchQuery && (
            <p className="text-muted-foreground">
              Showing results for: &quot;{searchQuery}&quot;
            </p>
          )}
        </div>

        {/* Use the new ResourceTable component */}
        <ResourceTable
          resources={filteredResources}
          modules={modules}
          onUpdate={handleResourceUpdate}
          showModuleColumn={true}
          isLoading={resourcesLoading}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between px-3 py-3.5">
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
                <ModuleOperations sessionId={sessionId} />
              </Suspense>
            ) : (
              <ResourceUploadButton
                variant="outline"
                moduleId={preselectedModuleId || undefined}
                initialOpen={openResourceUpload}
              ></ResourceUploadButton>
            )}
          </div>

          <TabsContent value="modules" className="mt-2">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
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

// Export modules page with proper suspense boundary
export default function ModulesPage() {
  return (
    <Suspense fallback={<ModulesLoading />}>
      <Suspense fallback={<ModulesLoading />}>
        <SearchParamsReader>
          {(searchParams) => <ModulesPageContent searchParams={searchParams} />}
        </SearchParamsReader>
      </Suspense>
    </Suspense>
  );
}

// Add this export to allow dynamic rendering
export const dynamic = "force-dynamic";
