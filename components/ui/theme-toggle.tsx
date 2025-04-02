"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

/**
 * Renders a button that toggles the UI theme between light and dark modes.
 *
 * The component uses the next-themes hook to retrieve and update the current theme. It waits until
 * the component has mounted to render the toggle button, preventing mismatches during server-side rendering.
 *
 * The button displays a Sun icon when the resolved theme is dark (indicating a switch to light mode) and a
 * Moon icon when the resolved theme is light (indicating a switch to dark mode). Its title attribute reflects
 * the action performed on click.
 *
 * @returns A button element that toggles the theme.
 */
export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title={
        resolvedTheme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4 text-amber-500" />
      ) : (
        <Moon className="h-4 w-4 text-blue-400" />
      )}
    </Button>
  );
}
