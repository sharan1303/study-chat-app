"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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

export default function Sidebar({
  modules = [],
  loading = false,
  activeModule = null,
  onModuleChange,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get active module from URL if not provided in props
  const currentModule = activeModule || searchParams.get("module");

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
      // Use just the module name in URL for clean URLs
      const encodedName = encodeURIComponent(
        moduleName.toLowerCase().replace(/\s+/g, "-")
      );
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

      {/* Main navigation */}
      <div className="p-4 border-b">
        <nav className="grid gap-2">
          <Button
            variant={isActive("/") ? "secondary" : "ghost"}
            className="justify-start"
            asChild
          >
            <Link href="/">Home</Link>
          </Button>
          <Button
            variant={isActive("/modules") ? "secondary" : "ghost"}
            className="justify-start"
            asChild
          >
            <Link href="/modules">Modules</Link>
          </Button>
        </nav>
      </div>

      {/* Modules section */}
      <div className="flex-1 overflow-hidden px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-md font-semibold">Your Modules</h2>
          <SignedIn>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/modules")}
              className="h-7 w-7 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </SignedIn>
        </div>
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="grid gap-1 pr-4">
            <SignedIn>
              {loading ? (
                <div className="text-sm text-muted-foreground py-2">
                  Loading modules...
                </div>
              ) : modules.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2">
                  No modules found. Create one to get started.
                </div>
              ) : (
                modules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => handleModuleClick(module.id, module.name)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg mb-1 flex items-center gap-2 transition-colors",
                      module.id === currentModule
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <span className="text-lg">{module.icon}</span>
                    <span className="text-sm font-medium truncate">
                      {module.name}
                    </span>
                  </button>
                ))
              )}
            </SignedIn>
            <SignedOut>
              <div className="text-sm text-muted-foreground py-2">
                Sign in to see your modules
              </div>
            </SignedOut>
          </div>
        </ScrollArea>
      </div>

      {/* User account section */}
      <div className="mt-auto border-t pt-4 px-3">
        <SignedIn>
          <div className="flex items-center justify-between">
            <UserButton showName />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/settings")}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <Button variant="outline" className="w-full">
              Sign in
            </Button>
          </SignInButton>
        </SignedOut>
      </div>
    </div>
  );
}
