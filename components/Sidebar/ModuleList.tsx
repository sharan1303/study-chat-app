"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, encodeModuleSlug } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { ModuleForm } from "@/components/dialogs/ModuleForm";
import { Plus } from "lucide-react";
import { getOSModifierKey, SHORTCUTS } from "@/lib/utils";
import { useNavigation } from "./SidebarParts";
import { useSidebar } from "@/context/sidebar-context";

// Define the Module type here instead of importing from Sidebar
export interface Module {
  id: string;
  name: string;
  context?: string | null;
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
  maxWidth?: string;
}

/**
 * Renders a list of module buttons with navigation and creation capabilities.
 *
 * This component displays module buttons that, when clicked, either trigger a provided callback or navigate to a module's detail page using a slugified module name. It highlights the active module based on a custom active-check function or the current pathname and supports both a regular and a compact view. When no modules are available and loading is complete, it prompts the user to create their first module via a dialog. The component listens for the "module-create-success" event to close the creation dialog and refresh the module list.
 *
 * @param modules - The list of modules to display.
 * @param loading - Indicates whether module data is currently being loaded.
 * @param currentModule - The identifier of the currently active module.
 * @param isActive - Optional function to determine if a module is active; defaults to comparing the module name with the current pathname.
 * @param handleModuleClick - Optional callback invoked when a module is clicked; if absent, navigation to the module detail page is performed.
 * @param pathname - An optional pathname used to assess active state; if not provided, the current URL path is used.
 * @param collapsed - When true, renders the module list in a compact format.
 * @param maxWidth - Optional maximum width for module items.
 */
export default function ModuleList({
  modules = [],
  loading = false,
  isActive,
  handleModuleClick,
  pathname: pathnameFromProps,
  router: routerFromProps,
  collapsed = false,
  maxWidth,
}: ModuleListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const nextRouter = useRouter();
  const nextPathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { navigate } = useNavigation();

  const router = React.useMemo(
    () =>
      routerFromProps || {
        push: (url: string) => {
          if (isMobile) {
            setOpenMobile(false);
          }
          nextRouter.push(url);
        },
        refresh: () => nextRouter.refresh(),
      },
    [routerFromProps, nextRouter, isMobile, setOpenMobile]
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

    window.addEventListener("module.created", handleModuleCreateSuccess);

    return () => {
      window.removeEventListener("module.created", handleModuleCreateSuccess);
    };
  }, [handleCreateSuccess]);

  const onModuleClick = (moduleId: string, moduleName: string) => {
    if (handleModuleClick) {
      handleModuleClick(moduleId, moduleName);
      if (isMobile) {
        setOpenMobile(false);
      }
    } else {
      const encodedName = encodeModuleSlug(moduleName);
      navigate(`/modules/${encodedName}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {!collapsed && (
        <div className="px-2 py-1 flex items-center justify-between">
          <Button
            variant={pathname?.startsWith("/modules") ? "secondary" : "ghost"}
            className="justify-start hover:bg-accent w-40 pl-2 pb-2 text-left"
            asChild
            title="Open Dashboard"
            onClick={() => {
              if (isMobile) {
                setOpenMobile(false);
              }
            }}
          >
            <Link href="/modules">Modules & Resources</Link>
          </Button>

          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-accent h-8 w-8 mr-2.5"
                title={`Create New Module (${getOSModifierKey()}+${
                  SHORTCUTS.NEW_MODULE
                })`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle className="text-xl font-bold ml-4">
                Create New Module
              </DialogTitle>
              <ModuleForm successEventName="module.created" />
            </DialogContent>
          </Dialog>
        </div>
      )}

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className={collapsed ? "p-1" : "p-2 pt-0"}>
          {loading ? (
            <div className="text-center py-5">
              {!collapsed && (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-r-transparent mx-auto mb-2" />
                </>
              )}
            </div>
          ) : modules.length === 0 ? (
            !collapsed && (
              <div className="text-center py-2 px-1">
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="default">
                      Create your first module
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle className="text-xl font-bold ml-4">
                      Create New Module
                    </DialogTitle>
                    <ModuleForm successEventName="module.created" />
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
                  style={{ maxWidth: maxWidth }}
                  className={cn(
                    "w-full text-left px-2 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground flex items-center gap-2",
                    checkIsActive(`/modules/${encodeModuleSlug(module.name)}`)
                      ? "bg-accent text-accent-foreground font-regular border-r-4 border-primary shadow-sm"
                      : "",
                    collapsed && "justify-center"
                  )}
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
