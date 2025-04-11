import React from "react";
import type { Metadata, Viewport } from "next";

import "./globals.css";
import localFont from "next/font/local";

import ClientSidebar from "@/components/Sidebar/ClientSidebar";
import { CommandK } from "@/components/dialogs/command-k";

import { Providers as AppProviders } from "@/context/providers";
import { SidebarProvider } from "@/context/sidebar-context";
import { SessionProvider } from "@/context/session-context";
import { KeyboardShortcutsProvider } from "@/context/keyboard-shortcuts-context";

import AnonymousDataMigration from "@/components/dialogs/AnonymousDataMigration";

import PrivacyConsentBar from "@/components/dialogs/PrivacyConsentBar";
import { ClerkProviderWithTheme } from "@/components/Clerk/ClerkProviderWithTheme";
import { GlobalModuleDialog } from "@/components/dialogs/GlobalModuleCreationDialog";
import { GlobalResourceUploadDialog } from "@/components/dialogs/GlobalResourceUploadDialog";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Session initializer - client component
import { SessionInitializer } from "@/components/Main/SessionInitializer";

// Font files
const myFont = localFont({
  src: "fonts/AtkinsonHyperlegibleNextVF-Variable.woff2",
});

export const metadata: Metadata = {
  title: "Study Chat - Your Personal Study Assistant",
  description: "AI-powered study assistant for university modules",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

/**
 * Root layout component that sets up the application's provider hierarchy.
 *
 * Provider Structure (from outermost to innermost):
 * 1. AppProviders - Sets up global app configuration and utilities
 * 2. ClerkProviderWithTheme - Handles authentication and user management with theme support
 * 3. SessionProvider - Manages user session state and persistence
 * 4. KeyboardShortcutsProvider - Manages global keyboard shortcuts
 * 5. SidebarProvider - Controls sidebar state (open/closed) and related functionality
 *
 * Additional Components:
 * - SessionInitializer: Client-side component that initializes session data
 * - AnonymousDataMigration: Handles migration of anonymous user data after sign-in
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to be wrapped by providers
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${myFont.className} overflow-hidden flex`}>
        <AppProviders>
          <ClerkProviderWithTheme>
            <SessionProvider>
              <KeyboardShortcutsProvider>
                <SidebarProvider>
                  <ClientSidebar />

                  <main className="flex-1 relative">
                    {children}
                    <Analytics />
                    <SpeedInsights />
                    <AnonymousDataMigration />
                  </main>

                  <PrivacyConsentBar />
                  <GlobalModuleDialog />
                  <GlobalResourceUploadDialog />
                  <CommandK />
                </SidebarProvider>
              </KeyboardShortcutsProvider>
              <SessionInitializer />
            </SessionProvider>
          </ClerkProviderWithTheme>
        </AppProviders>
      </body>
    </html>
  );
}
