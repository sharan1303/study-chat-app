"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, encodeModuleSlug } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ModuleForm } from "@/components/module-form";
import { Plus } from "lucide-react";

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
  const [isCreating, setIsCreating] = useState(false);
  const nextRouter = useRouter();
  const nextPathname = usePathname();

  const router = React.useMemo(
    () =>
      routerFromProps || {
        push: (url: string) => nextRouter.push(url),
        refresh: () => nextRouter.refresh(),
      },
    [routerFromProps, nextRouter]
  );

  const pathname = pathnameFromProps || nextPathname;

  const checkIsActive = isActive || ((path: string) => pathname === path);

  const handleCreateSuccess = React.useCallback(() => {
    setIsCreating(false);
    router.refresh();
  }, [router, setIsCreating]);

  // Listen for module create success event
  React.useEffect(() => {
    const handleModuleCreateSuccess = () => {
      handleCreateSuccess();
    };

    window.addEventListener("module-create-success", handleModuleCreateSuccess);
    return () => {
      window.removeEventListener(
        "module-create-success",
        handleModuleCreateSuccess
      );
    };
  }, [handleCreateSuccess]);

  const onModuleClick = (moduleId: string, moduleName: string) => {
    if (handleModuleClick) {
      handleModuleClick(moduleId, moduleName);
    } else {
      const encodedName = encodeModuleSlug(moduleName);
      router.push(`/modules/${encodedName}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {!collapsed && (
        <div className="px-2 py-2 flex items-center justify-between">
          <Button
            variant={pathname?.startsWith("/modules") ? "secondary" : "ghost"}
            className="justify-start w-40 pl-2 pb-2 text-left"
            asChild
          >
            <Link href="/modules">Chat Categories</Link>
          </Button>

          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 mr-3">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <ModuleForm successEventName="module-create-success" />
            </DialogContent>
          </Dialog>
        </div>
      )}

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className={collapsed ? "p-1" : "p-2 pt-0"}>
          {loading ? (
            <div className="text-center py-6">
              {!collapsed && (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-r-transparent mx-auto mb-2" />
                </>
              )}
            </div>
          ) : modules.length === 0 ? (
            !collapsed && (
              <div className="text-center p-2">
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                  <DialogTrigger asChild>
                    <Button className="mt-2 w-full" size="sm">
                      Create your first module
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <ModuleForm successEventName="module-create-success" />
                  </DialogContent>
                </Dialog>
              </div>
            )
          ) : (
            <nav className="grid gap-1">
              {modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => onModuleClick(module.id, module.name)}
                  className={cn(
                    "flex items-center gap-2 p-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground max-w-[240px] text-left",
                    collapsed && "justify-center p-1",
                    (currentModule === module.id ||
                      checkIsActive(module.name)) &&
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
