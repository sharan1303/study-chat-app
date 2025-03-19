"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { Toaster } from "sonner";
import { SessionProvider } from "@/context/SessionContext";

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <SessionProvider>{children}</SessionProvider>
      <Toaster position="top-center" />
    </NextThemesProvider>
  );
}
