"use client";

import Link from "next/link";
import { Edit } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  name: string;
  icon: string;
  lastStudied?: string | null;
}

interface ModuleListProps {
  modules: Module[];
  loading: boolean;
  currentModule: string | null;
  isActive: (path: string) => boolean;
  handleModuleClick: (moduleId: string, moduleName: string) => void;
  pathname: string | null | undefined;
  router: any;
}

export default function ModuleList({
  modules = [],
  loading = false,
  currentModule = null,
  isActive,
  handleModuleClick,
  pathname,
  router,
}: ModuleListProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <Button
          variant={isActive("/modules") ? "secondary" : "ghost"}
          className="justify-start"
          asChild
        >
          <Link href="/modules">Your Modules</Link>
        </Button>
        <SignedIn>
          <div className="flex gap-1">
            {/* New Chat button - aware of module context */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                // If we're in a module path, get the module name from the URL
                const pathParts = pathname?.split("/") || [];
                if (
                  pathname &&
                  pathParts.length > 1 &&
                  pathParts[1] !== "modules"
                ) {
                  // We're in a module chat (like /module-name)
                  router.push(`/${pathParts[1]}`);
                } else if (
                  pathname &&
                  pathname.startsWith("/modules/") &&
                  pathParts.length > 2
                ) {
                  // We're in a module details page (like /modules/module-name)
                  router.push(`/${pathParts[2]}`);
                } else {
                  // Not in a module context, go to the main chat
                  router.push("/");
                }
              }}
              title="Start new chat"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </SignedIn>
      </div>

      <ScrollArea className="h-[calc(100vh-13rem)]">
        <div className="p-4 pt-0">
          {loading ? (
            <div className="text-center py-6">
              <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-r-transparent mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                Loading modules...
              </p>
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No modules found</p>
              <SignedIn>
                <Button className="mt-2" size="sm" asChild>
                  <Link href="/modules">Create your first module</Link>
                </Button>
              </SignedIn>
              <SignedOut>
                <p className="text-xs text-muted-foreground mt-2">
                  Sign in to create modules
                </p>
              </SignedOut>
            </div>
          ) : (
            <nav className="grid gap-1">
              {modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => handleModuleClick(module.id, module.name)}
                  className={cn(
                    "flex items-center gap-2 p-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground w-full text-left",
                    currentModule === module.id &&
                      "bg-accent text-accent-foreground"
                  )}
                >
                  <span>{module.icon}</span>
                  <span className="truncate">{module.name}</span>
                </button>
              ))}
            </nav>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
