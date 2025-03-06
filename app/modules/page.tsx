import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Clock, Edit, Plus, Trash } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

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
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ModuleForm } from "@/components/module-form";
import ModuleActions from "./module-actions";
import { formatDate } from "@/lib/utils";

// Client component for module operations to be loaded in a Suspense boundary
import ModuleOperations from "./module-operations";

export default async function ModulesPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex h-14 items-center border-b px-4">
            <h2 className="text-3xl font-bold tracking-tight">Your Modules</h2>
          </div>
          <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
            <h3 className="text-xl font-medium">Please sign in</h3>
            <p className="text-muted-foreground">
              You need to be signed in to view and manage your modules
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch modules from the database on the server
  const modules = await prisma.module.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      lastStudied: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Convert Date objects to strings for client components
  const serializedModules = modules.map((module) => ({
    ...module,
    lastStudied: module.lastStudied ? module.lastStudied.toISOString() : null,
    createdAt: module.createdAt.toISOString(),
    updatedAt: module.updatedAt.toISOString(),
  }));

  // Filter recent modules
  const recentModules = serializedModules
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
        <div className="flex h-14 items-center justify-between border-b px-4">
          <h2 className="text-3xl font-bold tracking-tight">Your Modules</h2>
          <Suspense fallback={<Button disabled>Loading...</Button>}>
            <ModuleOperations />
          </Suspense>
        </div>

        {modules.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
            <h3 className="text-xl font-medium">No modules found</h3>
            <p className="text-muted-foreground">
              Create your first module to get started
            </p>
            <Suspense
              fallback={
                <Button size="lg" disabled>
                  Loading...
                </Button>
              }
            >
              <ModuleOperations showLarge={true} />
            </Suspense>
          </div>
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="all">All Modules</TabsTrigger>
              <TabsTrigger value="recent">Recently Studied</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {serializedModules.map((module) => (
                  <Card key={module.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <span className="text-3xl mr-2">{module.icon}</span>
                          <CardTitle className="text-xl">
                            {module.name}
                          </CardTitle>
                        </div>
                        <Suspense
                          fallback={<div className="flex space-x-1 h-8" />}
                        >
                          <ModuleActions
                            moduleId={module.id}
                            moduleName={module.name}
                          />
                        </Suspense>
                      </div>
                      <CardDescription className="mt-2">
                        {module.description || "No description provided"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {module.lastStudied
                              ? formatDate(module.lastStudied)
                              : "Never studied"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        asChild
                      >
                        <Link
                          href={`/${module.name
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          Study <ChevronRight className="h-4 w-4" />
                        </Link>
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
                  <Button>View All Modules</Button>
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
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(module.lastStudied || "")}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          asChild
                        >
                          <Link
                            href={`/${module.name
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                          >
                            Study <ChevronRight className="h-4 w-4" />
                          </Link>
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
