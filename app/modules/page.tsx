"use client";

import { Suspense, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PlusCircle, Search } from "lucide-react";
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
  updatedAt?: string;
}

function ModulesLoading() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="h-7 w-36 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-9 w-24 bg-gray-200 animate-pulse rounded"></div>
        </div>
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
      </div>
    </div>
  );
}

// Create a component that uses useSearchParams inside Suspense
function ModulesPageContent() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  const [activeTab, setActiveTab] = useState(() => {
    // Get tab from URL param or default to "modules"
    return searchParams?.get("tab") || "modules";
  });
  const [isLoading, setIsLoading] = useState(true);

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
        setModules(data);
        setFilteredModules(data);
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

  if (!isLoaded) {
    return <ModulesLoading />;
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex-1 space-y-4">
          <div className="flex p-3 items-center">
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
    const [resources, setResources] = useState<Resource[]>([]);
    const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
    const [resourcesLoading, setResourcesLoading] = useState(true);

    // Fetch resources from the API
    useEffect(() => {
      async function fetchResources() {
        try {
          setResourcesLoading(true);
          const response = await fetch("/api/resources");

          if (!response.ok) {
            throw new Error("Failed to fetch resources");
          }

          const data = await response.json();
          setResources(data);
          setFilteredResources(data);
        } catch (error) {
          console.error("Error fetching resources:", error);
          // Set resources to empty array on error
          setResources([]);
          setFilteredResources([]);
        } finally {
          setResourcesLoading(false);
        }
      }

      if (isSignedIn) {
        fetchResources();
      } else {
        setResourcesLoading(false);
      }
    }, []);

    // Filter resources based on search query
    useEffect(() => {
      if (resources.length > 0) {
        if (!searchQuery) {
          setFilteredResources(resources);
        } else {
          const filtered = resources.filter(
            (resource) =>
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
    }, [searchQuery, resources]);

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
          {!searchQuery && (
            <Button onClick={() => router.push("/modules/new")}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Upload Resource
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="mt-6">
        {searchQuery && (
          <p className="text-center text-muted-foreground mb-8">
            Showing results for: &quot;{searchQuery}&quot;
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{resource.title}</CardTitle>
                <CardDescription className="mt-2 line-clamp-2">
                  {resource.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-sm text-muted-foreground">
                  Module: {resource.moduleName || "No module"}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2 text-xs text-muted-foreground">
                <span>Added {formatDate(resource.createdAt)}</span>
                {resource.url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() =>
                      resource.url && window.open(resource.url, "_blank")
                    }
                  >
                    View
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4 px-8">
        <div className="flex items-center justify-between p-3">
          <h1 className="font-bold text-2xl">Study Content</h1>
          <Suspense fallback={<Button disabled>Loading...</Button>}>
            <ModuleOperations />
          </Suspense>
        </div>

        {/* Search bar */}
        <div className="relative mb-6 px-3">
          <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={
              activeTab === "modules"
                ? "Search modules..."
                : "Search resources..."
            }
            className="pl-10 max-w-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabs for Module and Resources */}
        <Tabs
          defaultValue={activeTab}
          className="px-3"
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="resources">All Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="mt-6">
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
                {!searchQuery && (
                  <Button onClick={() => router.push("/modules/new")}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create module
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredModules.map((module) => (
                  <Link href={`/modules/${module.name}`} key={module.name}>
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
                        <p className="text-sm text-muted-foreground">
                          {module.resourceCount} resources
                        </p>
                      </CardContent>
                      <CardFooter>
                        <p className="text-xs text-muted-foreground">
                          Updated {formatDate(module.updatedAt)}
                        </p>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            <ResourcesWrapper searchQuery={searchQuery} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
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
