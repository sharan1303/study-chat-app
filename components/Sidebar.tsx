"use client";

import React, { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
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
  return (
    <div className="w-64 flex flex-col h-screen border-r bg-background animate-pulse">
      <div className="p-4 border-b">
        <div className="h-6 w-24 bg-muted rounded"></div>
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
    <div className="w-64 flex flex-col h-screen border-r bg-background">
      {/* App branding */}
      <div className="p-4 border-b">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold">StudyAI</span>
        </Link>
      </div>

      {/* Modules list */}
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
            <Button size="icon" variant="ghost" asChild>
              <Link href="/modules">
                <Plus className="h-4 w-4" />
              </Link>
            </Button>
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

      {/* User section */}
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
