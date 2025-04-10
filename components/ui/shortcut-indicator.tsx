import { getOSModifierKey } from "@/lib/utils";
import { cn } from "@/lib/utils";
import React from "react";

interface ShortcutIndicatorProps {
  modifierKey?: string;
  showShift?: boolean;
  shortcutKey: string;
  className?: string;
}

export function ShortcutIndicator({
  modifierKey,
  showShift = false,
  shortcutKey,
  className,
}: ShortcutIndicatorProps) {
  const modifier = modifierKey || getOSModifierKey();

  return (
    <div className={cn("flex items-center gap-1 text-xs", className)}>
      {/* Command/Ctrl key */}
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-center font-medium text-accent-foreground">
        {modifier}
      </div>

      {/* Optional Shift key */}
      {showShift && (
        <div className="flex h-6 w-14 items-center justify-center rounded-md bg-pink-100 text-center font-medium text-pink-700">
          Shift
        </div>
      )}

      {/* Shortcut key */}
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-center font-medium text-accent-foreground">
        {shortcutKey}
      </div>
    </div>
  );
}
