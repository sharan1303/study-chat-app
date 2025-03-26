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
    <div className="absolute top-3 right-4 z-[30]">
      <ThemeToggle />
    </div>
  );
}
