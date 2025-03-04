"use client";

import { ChevronRight, BookOpen, Upload, Clock } from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ModulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModuleSelect: (moduleId: string) => void;
}

export function ModulesDialog({
  open,
  onOpenChange,
  onModuleSelect,
}: ModulesDialogProps) {
  const modules = [
    {
      id: "cs101",
      name: "Computer Science 101",
      description: "Introduction to programming concepts and algorithms",
      icon: "💻",
      resources: 12,
      lastStudied: "2 days ago",
    },
    {
      id: "math201",
      name: "Advanced Mathematics",
      description: "Calculus, linear algebra, and differential equations",
      icon: "🧮",
      resources: 8,
      lastStudied: "1 week ago",
    },
    {
      id: "phys150",
      name: "Physics Fundamentals",
      description: "Mechanics, thermodynamics, and electromagnetism",
      icon: "⚛️",
      resources: 10,
      lastStudied: "3 days ago",
    },
    {
      id: "bio220",
      name: "Molecular Biology",
      description: "Cell structure, genetics, and biochemistry",
      icon: "🧬",
      resources: 6,
      lastStudied: "Just started",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Your Study Modules</DialogTitle>
          <DialogDescription>
            Select a module to start studying or create a new one
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Modules</TabsTrigger>
              <TabsTrigger value="recent">Recently Studied</TabsTrigger>
              <TabsTrigger value="new">Create New</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.map((module) => (
                  <Card key={module.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{module.icon}</span>
                          <CardTitle>{module.name}</CardTitle>
                        </div>
                      </div>
                      <CardDescription>{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex justify-between items-center mb-1 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          Last studied: {module.lastStudied}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 ml-auto"
                        onClick={() => onModuleSelect(module.id)}
                      >
                        Study <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="recent">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {modules
                  .filter((m) => m.lastStudied !== "Just started")
                  .sort((a, b) => {
                    // Sort by days first, then by other time periods
                    const aDays = a.lastStudied.includes("day");
                    const bDays = b.lastStudied.includes("day");
                    if (aDays && !bDays) return -1;
                    if (!aDays && bDays) return 1;
                    return 0;
                  })
                  .map((module) => (
                    <Card key={module.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{module.icon}</span>
                            <CardTitle>{module.name}</CardTitle>
                          </div>
                        </div>
                        <CardDescription>{module.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex justify-between items-center mb-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            Last studied: {module.lastStudied}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 ml-auto"
                          onClick={() => onModuleSelect(module.id)}
                        >
                          Study <ChevronRight className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            </TabsContent>
            <TabsContent value="new" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create a New Study Module</CardTitle>
                  <CardDescription>
                    Add your own study materials and resources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button className="h-24 flex flex-col items-center justify-center gap-2">
                        <BookOpen className="h-8 w-8" />
                        <span>From Textbook</span>
                      </Button>
                      <Button className="h-24 flex flex-col items-center justify-center gap-2">
                        <Upload className="h-8 w-8" />
                        <span>Upload Files</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
