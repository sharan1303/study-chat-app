import ThemeToggle from "../ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { getOSModifierKey } from "@/lib/utils";

export default function Header() {
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
    <div className="rounded-lg bg-[hsl(var(--sidebar-background))] absolute top-3 right-3 flex-shrink-0 z-50 h-9 shadow-md">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSearchClick}
          title={`Search (${getOSModifierKey()}+K)`}
        >
          <Search className="h-5 w-5" />
        </Button>
        <ThemeToggle />
      </div>
    </div>
  );
}
