"use client";

import React, { Suspense, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Edit,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
} from "lucide-react";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, encodeModuleSlug } from "@/lib/utils";

interface Module {
  id: string;
  name: string;
  icon: string;
  lastStudied?: string | null;
}

interface SidebarProps {
  modules?: Module[];
  loading?: boolean;
  activeModule?: string | null;
  onModuleChange?: (moduleId: string) => void;
}

// Sidebar loading fallback
function SidebarSkeleton() {
  // Use the same styling as the expanded sidebar for the skeleton
  return (
    <div className="w-64 flex flex-col h-screen bg-background border-r animate-pulse">
      <div className="p-4 flex items-center justify-between border-b">
        <div className="h-6 w-24 bg-muted rounded"></div>
        <div className="h-8 w-8 bg-muted rounded"></div>
      </div>
      <div className="p-4 space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-muted rounded"></div>
        ))}
      </div>
    </div>
  );
}

// Wrap the component that uses useSearchParams in a dedicated function
function SidebarContent({
  modules = [],
  loading = false,
  activeModule = null,
  onModuleChange,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize with a default value to avoid hydration mismatch
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // Use a separate effect to handle localStorage after mounting
  const [hasMounted, setHasMounted] = useState(false);

  // Mark component as mounted
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Load from localStorage after component has mounted
  useEffect(() => {
    if (hasMounted && typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarCollapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    }
  }, [hasMounted]);

  // Save to localStorage when collapsed state changes
  useEffect(() => {
    if (hasMounted && typeof window !== "undefined") {
      localStorage.setItem("sidebarCollapsed", collapsed.toString());
    }
  }, [collapsed, hasMounted]);

  // Get active module from URL if not provided in props
  const currentModule = activeModule || searchParams?.get("module");

  // Determine if a navigation item is active
  const isActive = (path: string) => {
    return pathname === path;
  };

  // Handle clicking on a module - either call the parent callback or navigate
  const handleModuleClick = (moduleId: string, moduleName: string) => {
    if (onModuleChange) {
      onModuleChange(moduleId);
    } else {
      // If no callback provided, navigate to the module name as URL path
      // Use custom slug encoding for special characters
      const encodedName = encodeModuleSlug(moduleName);
      router.push(`/${encodedName}`);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen transition-all duration-300 ease-in-out",
        collapsed ? "w-20 bg-background" : "w-64 bg-background border-r"
      )}
    >
      {/* App branding */}
      <div
        className={cn(
          "p-4 flex items-center justify-between",
          collapsed ? "px-4 py-4 flex justify-center" : "border-b"
        )}
      >
        {!collapsed ? (
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold">StudyAI</span>
          </Link>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={collapsed ? "mx-auto" : "ml-auto"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Modules list - only show when expanded */}
      {!collapsed && (
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

                {/* Module creation button */}
                {/* <Button
                  size="icon"
                  variant="ghost"
                  asChild
                  title="Create new module"
                >
                  <Link href="/modules">
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button> */}
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
      )}

      {/* User section - only show when expanded */}
      {!collapsed && (
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    userButtonBox: {
                      flexDirection: "row-reverse",
                    },
                  },
                }}
                showName
              />
              <Button variant="ghost" size="icon" asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button>Sign in</Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      )}
    </div>
  );
}

// Export main component with Suspense
export default function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<SidebarSkeleton />}>
      <SidebarContent {...props} />
    </Suspense>
  );
}
