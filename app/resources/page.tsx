"use client";

// TODO: put resources under Modules as a tab inside of cards

import React, { useState, useEffect, Suspense } from "react";
import {
  File,
  Search,
  PlusCircle,
  Loader2,
  FileText,
  Video,
  Link as LinkIcon,
  Edit,
} from "lucide-react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

// Resource interface to match database schema
interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  url?: string | null;
  moduleId: string;
  moduleName?: string | null;
  createdAt: string;
}

// Loading component
function ResourcesPageLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading resources...</p>
      </div>
    </div>
  );
}

// Resource type icon component
function ResourceTypeIcon({ type }: { type: string }) {
  switch (type.toLowerCase()) {
    case "pdf":
      return <FileText className="h-5 w-5 text-red-500" />;
    case "video":
      return <Video className="h-5 w-5 text-blue-500" />;
    case "link":
      return <LinkIcon className="h-5 w-5 text-green-500" />;
    case "note":
      return <Edit className="h-5 w-5 text-yellow-500" />;
    default:
      return <File className="h-5 w-5" />;
  }
}

// Resources content component
function ResourcesContent() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const router = useRouter();

  // Fetch resources from the API
  useEffect(() => {
    async function fetchResources() {
      if (!isSignedIn || !userId) return;

      try {
        setLoading(true);
        const response = await fetch("/api/resources");

        if (!response.ok) {
          throw new Error("Failed to fetch resources");
        }

        const data = await response.json();
        setResources(data);
      } catch (error) {
        console.error("Error fetching resources:", error);
      } finally {
        setLoading(false);
      }
    }

    if (isSignedIn && userId) {
      fetchResources();
    } else {
      setLoading(false);
    }
  }, [isSignedIn, userId]);

  // Handle resource filtering based on search
  const filteredResources = searchQuery
    ? resources.filter(
        (resource) =>
          resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resource.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          resource.moduleName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : resources;

  if (!isLoaded) {
    return <ResourcesPageLoading />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        {/* Resources Header */}
        <div className="flex h-14 items-center justify-between border-b px-4 mb-4">
          <h1 className="text-3xl font-bold tracking-tight">Study Resources</h1>
          <Button
            disabled={!isSignedIn}
            onClick={() => router.push("/modules")}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search resources..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Resources Content */}
        {!isSignedIn ? (
          <div className="flex items-center justify-center flex-1 my-12">
            <Card className="w-[400px]">
              <CardHeader>
                <CardTitle>Sign in to access resources</CardTitle>
                <CardDescription>
                  Your study resources will be available after signing in
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <SignInButton mode="modal">
                  <Button className="w-full">Sign in</Button>
                </SignInButton>
              </CardFooter>
            </Card>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 p-4 text-center my-12">
            <File className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">No resources found</h2>
            <p className="text-muted-foreground max-w-md mb-4">
              {searchQuery
                ? `No resources match your search for "${searchQuery}"`
                : "You haven't added any resources yet"}
            </p>
            <Button onClick={() => router.push("/modules")}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add your first resource
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <Card
                key={resource.id}
                className="hover:shadow-md transition-shadow flex flex-col"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <ResourceTypeIcon type={resource.type} />
                      <CardTitle className="text-lg">
                        {resource.title}
                      </CardTitle>
                    </div>
                  </div>
                  {resource.moduleName && (
                    <CardDescription className="text-xs">
                      Module: {resource.moduleName}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pb-2 flex-1">
                  <p className="text-sm text-muted-foreground">
                    {resource.description}
                  </p>
                </CardContent>
                <CardFooter className="pt-2 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Added: {new Date(resource.createdAt).toLocaleDateString()}
                  </span>
                  {resource.url ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={resource.url} target="_blank">
                        View Resource
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/modules/${resource.moduleId}`)
                      }
                    >
                      View in Module
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Main component with Suspense
export default function ResourcesPage() {
  return (
    <Suspense fallback={<ResourcesPageLoading />}>
      <ResourcesContent />
    </Suspense>
  );
}
