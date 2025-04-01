"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

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
