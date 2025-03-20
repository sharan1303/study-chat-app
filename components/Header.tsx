"use client";

import ThemeToggle from "./ThemeToggle";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  // Don't render the header on the settings page
  if (pathname === "/settings") {
    return null;
  }

  return (
    <div className="absolute top-2 right-4 z-[60]">
      <ThemeToggle />
    </div>
  );
}
