"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  FileText,
  File,
  FileCode,
  FileImage,
  FileIcon,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";

// Resource type definition
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

// Component to display appropriate icon based on resource type
function ResourceTypeIcon({ type }: { type: string }) {
  switch (type.toLowerCase()) {
    case "pdf":
      return <FileIcon className="h-4 w-4" />;
    case "image":
      return <FileImage className="h-4 w-4" />;
    case "code":
      return <FileCode className="h-4 w-4" />;
    case "link":
      return <Link2 className="h-4 w-4" />;
    case "notes":
      return <FileText className="h-4 w-4" />;
    default:
      return <File className="h-4 w-4" />;
  }
}

export default function ResourceList({
  searchQuery = "",
}: {
  searchQuery?: string;
}) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch resources data
  useEffect(() => {
    async function fetchResources() {
      try {
        const response = await fetch("/api/resources");
        if (!response.ok) throw new Error("Failed to fetch resources");
        const data = await response.json();
        setResources(data);
        setFilteredResources(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching resources:", error);
        setIsLoading(false);
      }
    }

    if (isSignedIn) {
      fetchResources();
    } else {
      setIsLoading(false);
    }
  }, [isSignedIn]);

  // Filter resources based on search query
  useEffect(() => {
    if (resources.length > 0) {
      if (!searchQuery) {
        setFilteredResources(resources);
      } else {
        const filtered = resources.filter(
          (resource) =>
            resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  if (isLoading) {
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

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
        <h3 className="text-xl font-medium">Please sign in</h3>
        <p className="text-muted-foreground">
          You need to be signed in to view and manage your resources
        </p>
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
          <Button onClick={() => router.push("/modules")}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Upload Resource
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredResources.map((resource) => (
        <Card key={resource.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <ResourceTypeIcon type={resource.type} />
                <CardTitle className="text-base">{resource.title}</CardTitle>
              </div>
            </div>
            <CardDescription className="mt-2 line-clamp-2">
              {resource.description || "No description provided"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            {resource.moduleName && (
              <div className="text-sm text-muted-foreground">
                Module: {resource.moduleName}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between pt-2 text-xs text-muted-foreground">
            <span>Added {formatDate(resource.createdAt)}</span>
            {resource.url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => window.open(resource.url as string, "_blank")}
              >
                View
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
