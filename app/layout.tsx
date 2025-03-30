import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from '@clerk/themes'
import "./globals.css";
import type { Metadata, Viewport } from "next";
import ClientSidebar from "@/components/ClientSidebar";
import { Providers as AppProviders } from "@/lib/providers";
import { SidebarProvider } from "@/lib/sidebar-context";
import { SessionProvider } from "@/context/SessionContext";
import AnonymousDataMigration from "@/components/AnonymousDataMigration";
import Header from "@/components/Header";
import localFont from 'next/font/local'

// Session initializer - client component
import { SessionInitializer } from "@/components/SessionInitializer";

// Font files
const myFont = localFont({ src: 'fonts/AtkinsonHyperlegibleNextVF-Variable.woff2' })

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
  baseTheme: [dark],
  variables: {
    colorInputBackground: "#ffffff",
    colorInputText: "#000000",
  },
  elements: {
    modalCloseButton: "absolute right-4 top-4",
    card: "rounded-lg shadow-md",    
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
        <body className={`${myFont.className} overflow-hidden flex`}>
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
