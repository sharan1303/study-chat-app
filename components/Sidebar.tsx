"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn, encodeModuleSlug } from "@/lib/utils";

// Import component files
import SidebarHeader from "./SidebarHeader";
import ModuleList from "./ModuleList";
import UserSection from "./UserSection";
import ChatHistory, { Chat } from "./ChatHistory";

// Define Module interface within the file
export interface Module {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  lastStudied?: string | null;
  createdAt?: string | null;
  resourceCount?: number;
}

interface SidebarProps {
  modules: Module[];
  loading?: boolean;
  activeModule?: string | null;
  onModuleChange?: (moduleId: string) => void;
  errorMessage?: string | null;
  chats?: Chat[];
  chatsLoading?: boolean;
}

export default function Sidebar({
  modules,
  loading = false,
  activeModule = null,
  onModuleChange,
  errorMessage = null,
  chats = [],
  chatsLoading = false,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize with a default value to avoid hydration mismatch
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // Track current active module ID - we'll use this for future chat history
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

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
  const currentModule = activeModule || searchParams?.get("module") || null;

  // Update the activeModuleId when it changes
  useEffect(() => {
    if (currentModule) {
      setActiveModuleId(currentModule);
    }
  }, [currentModule]);

  // Add an effect to report the active module ID when it changes
  useEffect(() => {
    if (activeModuleId && typeof window !== "undefined") {
      // This could be expanded in the future to implement chat history
      console.log(`Active module changed to: ${activeModuleId}`);

      // Store the last active module ID in localStorage
      localStorage.setItem("lastActiveModuleId", activeModuleId);
    }
  }, [activeModuleId]);

  // Determine if a navigation item is active
  const isActive = (path: string) => {
    return pathname === path;
  };

  // Handle clicking on a module - either call the parent callback or navigate
  const handleModuleClick = (moduleId: string, moduleName?: string) => {
    // Update active module state for future chat history implementation
    setActiveModuleId(moduleId);
    console.log(`Active module set to: ${moduleId}`);

    if (onModuleChange) {
      onModuleChange(moduleId);
    } else if (moduleName) {
      // If no callback provided, navigate to the module name as URL path
      // Use custom slug encoding for special characters
      const encodedName = encodeModuleSlug(moduleName);
      router.push(`/${encodedName}/chat`);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen transition-all duration-300 ease-in-out",
        collapsed ? "w-20 bg-background" : "w-64 bg-background border-r"
      )}
    >
      {/* App branding and toggle */}
      <SidebarHeader collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Modules list and Chat History Container - only show when expanded */}
      {!collapsed && (
        <div className="flex flex-col h-[calc(100vh-9rem)] overflow-hidden">
          {/* Show error message if there is one */}
          {errorMessage && (
            <div className="px-4 py-2 mt-2 text-sm text-red-600 bg-red-50 rounded mx-2 mb-2">
              <p className="font-semibold">Error loading modules:</p>
              <p className="text-xs break-words">{errorMessage}</p>
            </div>
          )}

          {/* Module List - 1/3 of the available space */}
          <div className="h-1/3 min-h-[150px]">
            <ModuleList
              modules={modules}
              loading={loading}
              currentModule={currentModule}
              isActive={isActive}
              handleModuleClick={handleModuleClick}
              pathname={pathname}
              router={router}
            />
          </div>

          {/* Chat History Section - 2/3 of the available space */}
          <div className="h-2/3">
            {(chats.length > 0 || chatsLoading) && (
              <ChatHistory chats={chats} loading={chatsLoading} />
            )}
          </div>
        </div>
      )}

      {/* User section - only show when expanded */}
      {!collapsed && <UserSection />}
    </div>
  );
}
