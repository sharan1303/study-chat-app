import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientSidebar from "@/components/ClientSidebar";
import { Providers } from "@/lib/providers";
import { SidebarProvider } from "@/lib/sidebar-context";

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
          <Providers>
            <SidebarProvider defaultOpen={true}>
              <ClientSidebar key="sidebar" />
              <main className="flex-1 py-2">{children}</main>
            </SidebarProvider>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
