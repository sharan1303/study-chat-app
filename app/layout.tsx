import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientSidebar from "@/components/ClientSidebar";
import { Providers } from "@/lib/providers";
import { SidebarProvider } from "@/lib/sidebar-context";
import { SessionProvider } from "@/context/SessionContext";
import AnonymousDataMigration from "@/components/AnonymousDataMigration";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Study Chat - Your University Study Assistant",
  description: "AI-powered study assistant for university modules",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body className={`${inter.className} overflow-hidden flex`}>
          <SessionProvider>
            <Providers>
              <SidebarProvider defaultOpen={true}>
                <ClientSidebar />
                <main className="flex-1 pl-7 pt-0.5 relative">
                  <Header />
                  {children}
                  <AnonymousDataMigration />
                </main>
              </SidebarProvider>
            </Providers>
          </SessionProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
