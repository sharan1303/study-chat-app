"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn, encodeModuleSlug } from "@/lib/utils";
import { useModuleStore, Module } from "@/lib/store";

// Import component files
import SidebarHeader from "./SidebarHeader";
import ModuleList from "./ModuleList";
import UserSection from "./UserSection";

interface SidebarProps {
  modules?: Module[];
  loading?: boolean;
  activeModule?: string | null;
  onModuleChange?: (moduleId: string) => void;
}

export default function Sidebar({
  modules: propModules,
  loading: propLoading = false,
  activeModule = null,
  onModuleChange,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get modules from the store for shared state across pages
  const {
    modules: storeModules,
    loading: storeLoading,
    setActiveModuleId,
  } = useModuleStore();

  // Use props if provided, otherwise use store
  const modules =
    propModules && propModules.length > 0 ? propModules : storeModules;
  // Simplified loading state
  const loading = propLoading || storeLoading;

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
  const currentModule = activeModule || searchParams?.get("module") || null;

  // Update the activeModuleId in store when it changes
  useEffect(() => {
    if (currentModule) {
      setActiveModuleId(currentModule);
    }
  }, [currentModule, setActiveModuleId]);

  // Determine if a navigation item is active
  const isActive = (path: string) => {
    return pathname === path;
  };

  // Handle clicking on a module - either call the parent callback or navigate
  const handleModuleClick = (moduleId: string, moduleName: string) => {
    // Update active module in store
    setActiveModuleId(moduleId);

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
      {/* App branding and toggle */}
      <SidebarHeader collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Modules list - only show when expanded */}
      {!collapsed && (
        <ModuleList
          modules={modules}
          loading={loading}
          currentModule={currentModule}
          isActive={isActive}
          handleModuleClick={handleModuleClick}
          pathname={pathname}
          router={router}
        />
      )}

      {/* User section - only show when expanded */}
      {!collapsed && <UserSection />}
    </div>
  );
}
