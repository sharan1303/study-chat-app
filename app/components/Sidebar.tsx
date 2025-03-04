"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Layers, BookOpen, File, Plus, Settings } from "lucide-react";
import { Home as HomeIcon } from "lucide-react";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  name: string;
  icon: string;
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
  onModuleChange 
}: SidebarProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="w-64 bg-background border-r flex flex-col">
      {/* App logo and title */}
      <div className="p-4 border-b">
        <h1 className="font-bold text-xl flex items-center gap-2">
          <Layers className="h-5 w-5" />
          <span>StudyAI</span>
        </h1>
      </div>
      
      {/* Navigation links */}
      <div className="p-3">
        <nav className="space-y-1">
          <Button 
            variant={isActive("/") ? "default" : "ghost"} 
            className="w-full justify-start" 
            onClick={() => router.push("/")}
          >
            <HomeIcon className="h-4 w-4 mr-2" />
            Home
          </Button>
          <Button 
            variant={isActive("/modules") ? "default" : "ghost"} 
            className="w-full justify-start" 
            onClick={() => router.push("/modules")}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Modules
          </Button>
          <Button 
            variant={isActive("/resources") ? "default" : "ghost"} 
            className="w-full justify-start" 
            onClick={() => router.push("/resources")}
          >
            <File className="h-4 w-4 mr-2" />
            Resources
          </Button>
        </nav>
      </div>
      
      {/* Divider */}
      <div className="px-3 py-2">
        <div className="h-px bg-border"></div>
      </div>
      
      {/* Modules section */}
      <div className="px-3 pb-2 flex justify-between items-center">
        <h2 className="font-medium text-sm">Your Modules</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={() => router.push("/modules/new")}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Modules list */}
      <ScrollArea className="flex-1">
        {!isSignedIn ? (
          <div className="p-4 text-center text-muted-foreground">
            <p className="mb-2">Sign in to access your modules</p>
            <SignInButton mode="modal">
              <Button size="sm" variant="outline">Sign in</Button>
            </SignInButton>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin h-5 w-5 rounded-full border-b-2 border-primary"></div>
          </div>
        ) : modules.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p>No modules found</p>
            <Button
              variant="link"
              onClick={() => router.push("/modules")}
              className="mt-2"
            >
              Create a module
            </Button>
          </div>
        ) : (
          <div className="p-2">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => onModuleChange?.(module.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg mb-1 flex items-center gap-2 transition-colors",
                  module.id === activeModule
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                )}
              >
                <span className="text-xl">{module.icon}</span>
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium truncate">{module.name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* User account section */}
      <div className="p-3 border-t">
        {isSignedIn ? (
          <div className="flex flex-col gap-2">
            <div className="flex justify-center items-center gap-2 py-2">
              <UserButton afterSignOutUrl="/" />
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => router.push("/settings")}
                className="h-8 w-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/modules")}
            >
              Manage Modules
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <SignInButton mode="modal">
              <Button className="w-full">Sign in</Button>
            </SignInButton>
          </div>
        )}
      </div>
    </div>
  );
} 