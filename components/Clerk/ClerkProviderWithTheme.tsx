"use client";

import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import "./clerk-styles.css"; /**
 * Wraps the ClerkProvider with theme customization for authentication UI.
 *
 * This component uses the current UI theme to configure the appearance of Clerk's
 * authentication components. It applies a dark theme if the resolved theme is "dark",
 * and sets custom styles for elements such as the modal close button, primary form button,
 * and footer action link. The children are rendered within the themed ClerkProvider.
 *
 * @param children - React nodes to render within the ClerkProvider.
 */

export function ClerkProviderWithTheme({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === "dark";

  const clerkAppearance = {
    // Use dark theme for dark mode, omit baseTheme for light mode (default theme)
    baseTheme: isDarkTheme ? [dark] : undefined,
    
    elements: {
      modalCloseButton: "absolute right-4 top-4",
      formButtonPrimary:
        "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded",
      footerActionLink: isDarkTheme
        ? "text-blue-400 hover:text-blue-300 font-semibold"
        : "text-blue-600 hover:text-blue-800 font-semibold",
    },
  };

  return <ClerkProvider appearance={clerkAppearance}>{children}</ClerkProvider>;
}
