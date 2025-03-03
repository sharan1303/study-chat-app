import React from "react";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { NavLinks } from "@/components/nav-links";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StudyAI - Your University Study Assistant",
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
        <body className={inter.className}>
          <header className="flex justify-end items-center p-4 gap-4 h-16 border-b">
            <div className="container mx-auto flex justify-between items-center">
              <div className="flex items-center gap-6">
                <Link href="/" className="font-bold text-xl">
                  StudyChat
                </Link>
                <NavLinks />
              </div>
              <div className="flex items-center gap-4">
                <SignedOut>
                  <SignInButton mode="modal" />
                  <SignUpButton mode="modal" />
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </div>
          </header>
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
