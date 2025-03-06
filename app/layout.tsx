import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StudyAI - Your University Study Assistant",
  description: "AI-powered study assistant for university modules",
};

// Server component to fetch modules
async function fetchModules() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return [];
    }

    const modules = await prisma.module.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        name: true,
        icon: true,
        lastStudied: true,
      },
    });

    // Convert Date objects to ISO strings for client components
    return modules.map((module) => ({
      ...module,
      lastStudied: module.lastStudied ? module.lastStudied.toISOString() : null,
    }));
  } catch (error) {
    console.error("Error fetching modules:", error);
    return [];
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch modules on the server
  const modules = await fetchModules();

  return (
    <ClerkProvider>
      <html lang="en">
        <head />
        <body className={`${inter.className} overflow-hidden flex`}>
          <Sidebar modules={modules} />
          <main className="flex-1">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
