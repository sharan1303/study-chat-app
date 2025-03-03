"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ChevronRight, Plus, Edit, Trash, Loader2, Clock } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ModuleForm } from "@/components/module-form";

interface Module {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  progress: number;
  lastStudied: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ModulesPage() {
  const router = useRouter();
  const { isLoaded } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const fetchModules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/modules");
      setModules(response.data);
    } catch (error) {
      console.error("Error fetching modules:", error);
      toast.error("Failed to load modules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      fetchModules();
    }
  }, [isLoaded, fetchModules]);

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      await axios.delete(`/api/modules/${id}`);
      toast.success("Module deleted");
      fetchModules();
    } catch (error) {
      console.error("Error deleting module:", error);
      toast.error("Failed to delete module");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCreateSuccess = () => {
    console.log("Module creation successful, closing dialog");
    setIsCreating(false);
    fetchModules();
  };

  const handleEditSuccess = () => {
    console.log("Module edit successful, closing dialog");
    setEditingModule(null);
    fetchModules();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const recentModules = modules
    .filter((module) => module.lastStudied !== null)
    .sort((a, b) => {
      if (!a.lastStudied) return 1;
      if (!b.lastStudied) return -1;
      return (
        new Date(b.lastStudied).getTime() - new Date(a.lastStudied).getTime()
      );
    });

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Your Modules</h2>
          <Dialog
            open={isCreating}
            onOpenChange={(open) => {
              console.log("Dialog open state changed:", open);
              setIsCreating(open);
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Module
              </Button>
            </DialogTrigger>
            <DialogContent>
              <ModuleForm onSuccess={handleCreateSuccess} />
            </DialogContent>
          </Dialog>
        </div>

        {!isLoaded || loading ? (
          <div className="flex h-40 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : modules.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
            <h3 className="text-xl font-medium">No modules found</h3>
            <p className="text-muted-foreground">
              Create your first module to get started
            </p>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Module
                </Button>
              </DialogTrigger>
              <DialogContent>
                <ModuleForm onSuccess={handleCreateSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="all">All Modules</TabsTrigger>
              <TabsTrigger value="recent">Recently Studied</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
                  <Card key={module.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <span className="text-3xl mr-2">{module.icon}</span>
                          <CardTitle className="text-xl">
                            {module.name}
                          </CardTitle>
                        </div>
                        <div className="flex space-x-1">
                          <Dialog
                            open={editingModule?.id === module.id}
                            onOpenChange={(open) => {
                              if (!open) setEditingModule(null);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingModule(module)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              <ModuleForm
                                initialData={{
                                  id: module.id,
                                  name: module.name,
                                  description: module.description || undefined,
                                  icon: module.icon,
                                }}
                                onSuccess={handleEditSuccess}
                              />
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(module.id)}
                            disabled={isDeleting === module.id}
                          >
                            {isDeleting === module.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <CardDescription className="mt-2">
                        {module.description || "No description provided"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{module.progress}%</span>
                        </div>
                        <Progress value={module.progress} className="h-2" />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        Last studied: {formatDate(module.lastStudied)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => router.push(`/chat?module=${module.id}`)}
                      >
                        Study <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recent">
              {recentModules.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-lg">
                  <h3 className="text-xl font-medium mb-2">
                    No recently studied modules
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Start studying to see your recent modules here
                  </p>
                  <Button onClick={() => setActiveTab("all")}>
                    View All Modules
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentModules.map((module) => (
                    <Card key={module.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <span className="text-3xl mr-2">{module.icon}</span>
                            <CardTitle className="text-xl">
                              {module.name}
                            </CardTitle>
                          </div>
                        </div>
                        <CardDescription className="mt-2">
                          {module.description || "No description provided"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{module.progress}%</span>
                          </div>
                          <Progress value={module.progress} className="h-2" />
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          Last studied: {formatDate(module.lastStudied)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() =>
                            router.push(`/chat?module=${module.id}`)
                          }
                        >
                          Study <ChevronRight className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
