"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { File, Search, PlusCircle, Loader2 } from "lucide-react";
import { useAuth, SignInButton } from "@clerk/nextjs";

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
import { ScrollArea } from "@/components/ui/scroll-area";

import Sidebar from "@/app/components/Sidebar";

// Mock resource interface
interface Resource {
  id: string;
  title: string;
  description: string;
  type: "pdf" | "video" | "link" | "note";
  url?: string;
  moduleId?: string;
  moduleName?: string;
  createdAt: string;
}

// Sample resources data
const sampleResources: Resource[] = [
  {
    id: "1",
    title: "Introduction to Machine Learning",
    description: "Comprehensive guide on ML concepts",
    type: "pdf",
    moduleId: "ml101",
    moduleName: "Machine Learning",
    createdAt: "2023-06-01T12:00:00Z",
  },
  {
    id: "2",
    title: "Python Data Structures",
    description: "Tutorial on Python data structures and their applications",
    type: "video",
    url: "https://example.com/video",
    moduleId: "py101",
    moduleName: "Python Programming",
    createdAt: "2023-06-15T14:30:00Z",
  },
  {
    id: "3",
    title: "Calculus Formulas",
    description: "Key formulas for calculus problems",
    type: "note",
    moduleId: "math201",
    moduleName: "Calculus II",
    createdAt: "2023-07-02T09:15:00Z",
  },
];

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
function ResourceTypeIcon({ type }: { type: Resource["type"] }) {
  switch (type) {
    case "pdf":
      return <File className="h-5 w-5 text-red-500" />;
    case "video":
      return <File className="h-5 w-5 text-blue-500" />;
    case "link":
      return <File className="h-5 w-5 text-green-500" />;
    case "note":
      return <File className="h-5 w-5 text-yellow-500" />;
    default:
      return <File className="h-5 w-5" />;
  }
}

// Main ResourcesPage component
export default function ResourcesPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle resource filtering based on search
  const filteredResources = searchQuery
    ? sampleResources.filter(
        (resource) =>
          resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resource.moduleName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sampleResources;

  if (!isLoaded) {
    return <ResourcesPageLoading />;
  }

  return (
    <div className="flex h-screen">
      {/* Use the shared sidebar component */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Resources Header */}
        <div className="border-b p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="font-bold text-2xl">Study Resources</h1>
            <Button disabled={!isSignedIn}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search resources..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Resources Content */}
        {!isSignedIn ? (
          <div className="flex items-center justify-center flex-1">
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
          <ResourcesPageLoading />
        ) : filteredResources.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
            <File className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">No resources found</h2>
            <p className="text-muted-foreground max-w-md mb-4">
              {searchQuery
                ? `No resources match your search for "${searchQuery}"`
                : "You haven't added any resources yet"}
            </p>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add your first resource
            </Button>
          </div>
        ) : (
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {filteredResources.map((resource) => (
                <Card key={resource.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <ResourceTypeIcon type={resource.type} />
                        <CardTitle className="text-lg">{resource.title}</CardTitle>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <File className="h-4 w-4" />
                      </Button>
                    </div>
                    {resource.moduleName && (
                      <CardDescription className="text-xs">
                        Module: {resource.moduleName}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Added: {new Date(resource.createdAt).toLocaleDateString()}
                    </span>
                    <Button variant="outline" size="sm">
                      View Resource
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
} 