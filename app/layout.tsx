import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import ClientSidebar from "@/components/ClientSidebar";
import { Providers as AppProviders } from "@/lib/providers";
import { SidebarProvider } from "@/lib/sidebar-context";
import { SessionProvider } from "@/context/SessionContext";
import AnonymousDataMigration from "@/components/AnonymousDataMigration";
import Header from "@/components/Header";

// Session initializer - client component
import { SessionInitializer } from "@/components/SessionInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Study Chat - Your Personal Study Assistant",
  description: "AI-powered study assistant for university modules",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

// Clerk appearance config
const clerkAppearance = {
  elements: {
    formButtonPrimary:
      "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded",
    footerActionLink: "text-blue-600 hover:text-blue-800 font-semibold",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} overflow-hidden flex`}>
          <SessionProvider>
            <AppProviders>
              <SidebarProvider defaultOpen={true}>
                <ClientSidebar />
                <main className="flex-1 pl-7 pt-0.5 relative">
                  <Header />
                  {children}
                  <AnonymousDataMigration />
                </main>
              </SidebarProvider>
            </AppProviders>
            <SessionInitializer />
          </SessionProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
