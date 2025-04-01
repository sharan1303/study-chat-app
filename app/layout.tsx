import React from "react";
import type { Metadata, Viewport } from "next";

import "./globals.css";
import localFont from "next/font/local";

import ClientSidebar from "@/components/Sidebar/ClientSidebar";

import { Providers as AppProviders } from "@/context/providers";
import { SidebarProvider } from "@/context/sidebar-context";
import { SessionProvider } from "@/context/session-context";

import AnonymousDataMigration from "@/components/dialogs/AnonymousDataMigration";
import Header from "@/components/Main/Header";
import { ClerkProviderWithTheme } from "@/components/Clerk/ClerkProviderWithTheme";

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
              <SidebarProvider defaultOpen={true}>
                <ClientSidebar />
                <main className="flex-1 pl-7 pt-0.5 relative">
                  <Header />
                  {children}
                  <AnonymousDataMigration />
                </main>
              </SidebarProvider>
              <SessionInitializer />
            </SessionProvider>
          </ClerkProviderWithTheme>
        </AppProviders>
      </body>
    </html>
  );
}
