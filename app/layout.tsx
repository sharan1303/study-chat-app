import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientSidebar from "@/components/ClientSidebar";
import { Providers } from "@/lib/providers";

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
      <html lang="en">
        <head />
        <body className={`${inter.className} overflow-hidden flex`}>
          <Providers>
            <ClientSidebar key="sidebar" />
            <main className="flex-1">{children}</main>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
