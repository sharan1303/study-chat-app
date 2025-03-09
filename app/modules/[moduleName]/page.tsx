"use client";

import { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Check, MessageSquare, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import ModuleActions from "../module-actions";

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

export default function ModuleDetailsPage({
  params,
}: {
  params: { moduleName: string };
}) {
  const router = useRouter();
  const [module, setModule] = useState<Module | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchModuleDetails = async () => {
      try {
        setIsLoading(true);
        // Decode the module name from URL parameters
        const decodedModuleName = decodeURIComponent(params.moduleName);

        // Fetch module details
        const moduleResponse = await axios.get(
          `/api/modules?name=${decodedModuleName}`
        );

        // If no exact match is found, fetch all modules and find the closest match
        if (moduleResponse.data.length === 0) {
          const allModulesResponse = await axios.get("/api/modules");
          const allModules = allModulesResponse.data;

          // Try to find the module by name (case-insensitive)
          const matchedModule = allModules.find(
            (m: Module) =>
              m.name.toLowerCase() === decodedModuleName.toLowerCase()
          );

          if (matchedModule) {
            setModule(matchedModule);

            // Fetch resources for this module
            const resourcesResponse = await axios.get(
              `/api/resources?moduleId=${matchedModule.id}`
            );
            setResources(resourcesResponse.data);
          } else {
            return notFound();
          }
        } else {
          const moduleData = moduleResponse.data[0];
          setModule(moduleData);

          // Fetch resources for this module
          const resourcesResponse = await axios.get(
            `/api/resources?moduleId=${moduleData.id}`
          );
          setResources(resourcesResponse.data);
        }
      } catch (error) {
        console.error("Error fetching module details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModuleDetails();
  }, [params.moduleName]);

  // Set initial edit values when module data loads
  useEffect(() => {
    if (module) {
      setEditTitle(module.name);
      setEditDescription(module.description || "");
    }
  }, [module]);

  // Save module updates
  const saveModuleUpdate = async (updates: {
    name?: string;
    description?: string;
    icon?: string;
  }) => {
    if (!module) return;

    try {
      setIsSaving(true);
      await axios.put(`/api/modules/${module.id}`, {
        name: updates.name !== undefined ? updates.name : module.name,
        description:
          updates.description !== undefined
            ? updates.description
            : module.description,
        icon: updates.icon !== undefined ? updates.icon : module.icon,
      });

      // Update local state
      setModule({
        ...module,
        ...updates,
      });

      toast.success("Module updated");
    } catch (error) {
      console.error("Error updating module:", error);
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
  const cancelTitleEdit = () => {
    setEditTitle(module?.name || "");
    setIsEditingTitle(false);
  };

  const cancelDescriptionEdit = () => {
    setEditDescription(module?.description || "");
    setIsEditingDescription(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col p-3">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-7 w-36 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="space-y-6">
          <div className="h-5 w-3/4 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-16 w-full bg-gray-200 animate-pulse rounded"></div>
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!module) {
    return notFound();
  }

  return (
    <div className="flex flex-col min-h-screen p-3">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Module icon with popover for changing */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="text-2xl cursor-pointer hover:bg-muted h-10 w-10 p-0"
              >
                {module.icon}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="grid grid-cols-5 gap-2">
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
            <div className="flex items-center gap-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-xl font-bold h-10"
                autoFocus
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
              className="text-2xl font-bold cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
              onDoubleClick={() => setIsEditingTitle(true)}
            >
              {module.name}
            </h1>
          )}
        </div>
        <ModuleActions moduleId={module.id} moduleName={module.name} />
      </div>

      <div className="space-y-6 px-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          {/* Editable description */}
          {isEditingDescription ? (
            <div className="flex flex-col gap-2">
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="min-h-[100px]"
                placeholder="Add a description..."
                autoFocus
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
              className="text-muted-foreground cursor-pointer hover:bg-muted/50 p-2 rounded"
              onDoubleClick={() => setIsEditingDescription(true)}
            >
              {module.description ||
                "No description provided. Double-click to add one."}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <Button
            className="flex items-center gap-2"
            size="lg"
            onClick={() => router.push(`/${module.name}`)}
          >
            <MessageSquare className="h-5 w-5" />
            Go to Chat
          </Button>
        </div>

        <Separator className="my-6" />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Resources</h2>
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/modules/resources/new?moduleId=${module.id}`)
              }
            >
              Add Resource
            </Button>
          </div>

          {resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
              <h3 className="text-xl font-medium">No resources found</h3>
              <p className="text-muted-foreground">
                Add resources to this module to get started
              </p>
              <Button
                onClick={() =>
                  router.push(`/modules/resources/new?moduleId=${module.id}`)
                }
              >
                Add Resource
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {resources.map((resource) => (
                <Card key={resource.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {resource.title}
                    </CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {resource.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      Type: {resource.type || "Unknown"}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-xs text-muted-foreground">
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </div>
                    {resource.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          if (resource.url) window.open(resource.url, "_blank");
                        }}
                      >
                        View
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
