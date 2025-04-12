/**
 * Layout component for the modules section.
 * This wrapper ensures the loading.tsx file works properly by maintaining consistent layout.
 */

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modules - Study Chat",
  description: "Manage your modules",
};

export default function ModulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-screen flex-col">{children}</div>;
}
