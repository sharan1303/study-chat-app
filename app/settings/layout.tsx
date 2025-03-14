import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Settings - Study Chat",
  description: "Manage your settings and preferences",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-screen overflow-y-auto">{children}</div>;
}
