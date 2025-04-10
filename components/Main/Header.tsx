"use client";

import ThemeToggle from "../ui/theme-toggle";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { getOSModifierKey } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();

  // Don't render the header on the settings page
  if (pathname === "/settings") {
    return null;
  }

  const handleSearchClick = () => {
    // Trigger Command+K dialog by simulating the keyboard shortcut
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      ctrlKey: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <div className="absolute top-3 right-2 z-[30]">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSearchClick}
          title={`Search (${getOSModifierKey()}+K)`}
        >
          <Search className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>
    </div>
  );
}
