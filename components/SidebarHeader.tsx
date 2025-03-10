"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarHeaderProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

export default function SidebarHeader({
  collapsed,
  setCollapsed,
}: SidebarHeaderProps) {
  return (
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
  );
}
