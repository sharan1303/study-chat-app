"use client";

import React from "react";
import Link from "next/link";
import { Edit } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, encodeModuleSlug } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";

// Define the Module type here instead of importing from Sidebar
export interface Module {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  lastStudied?: string | null;
  createdAt?: string | null;
  resourceCount?: number;
}

interface ModuleListProps {
  modules: Module[];
  loading: boolean;
  currentModule?: string | null;
  isActive?: (path: string) => boolean;
  handleModuleClick?: (moduleId: string, moduleName?: string) => void;
  pathname?: string | null | undefined;
  router?: { push: (url: string) => void; refresh: () => void };
  collapsed?: boolean;
}

export default function ModuleList({
  modules = [],
  loading = false,
  currentModule = null,
  isActive,
  handleModuleClick,
  pathname: pathnameFromProps,
  router: routerFromProps,
  collapsed = false,
}: ModuleListProps) {
  // Use Next.js hooks if props are not provided
  const nextRouter = useRouter();
  const nextPathname = usePathname();

  // Use props if provided, otherwise use hooks
  const router = routerFromProps || {
    push: (url: string) => nextRouter.push(url),
    refresh: () => nextRouter.refresh(),
  };
  const pathname = pathnameFromProps || nextPathname;

  // Default isActive if not provided
  const checkIsActive = isActive || ((path: string) => pathname === path);

  // Simple module click handler to navigate or call parent handler
  const onModuleClick = (moduleId: string, moduleName: string) => {
    // Call parent handler if provided
    if (handleModuleClick) {
      handleModuleClick(moduleId, moduleName);
    } else {
      // Default behavior - navigate to the module chat page
      const encodedName = encodeModuleSlug(moduleName);
      router.push(`/${encodedName}/chat`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {!collapsed && (
        <div className="px-4 py-2 flex items-center justify-between">
          <Button
            variant={checkIsActive("/modules") ? "secondary" : "ghost"}
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
                    router.push(`/${pathParts[1]}/chat`);
                  } else if (
                    pathname &&
                    pathname.startsWith("/modules/") &&
                    pathParts.length > 2
                  ) {
                    // We're in a module details page (like /modules/module-name)
                    router.push(`/${pathParts[2]}/chat`);
                  } else {
                    // Not in a module context, go to the main chat
                    router.push("/chat");
                  }
                }}
                title="Start new chat"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </SignedIn>
        </div>
      )}

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className={collapsed ? "p-1" : "p-2"}>
          {loading ? (
            <div className="text-center py-6">
              {!collapsed && (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-r-transparent mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Loading modules...
                  </p>
                </>
              )}
            </div>
          ) : modules.length === 0 ? (
            !collapsed && (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  No modules found
                </p>
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
            )
          ) : (
            <nav className="grid gap-1">
              {modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => onModuleClick(module.id, module.name)}
                  className={cn(
                    "flex items-center gap-2 p-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground w-full text-left",
                    collapsed && "justify-center p-1",
                    currentModule === module.id &&
                      "bg-accent text-accent-foreground"
                  )}
                  title={collapsed ? module.name : undefined}
                >
                  <span>{module.icon}</span>
                  {!collapsed && (
                    <span className="truncate">{module.name}</span>
                  )}
                </button>
              ))}
            </nav>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
