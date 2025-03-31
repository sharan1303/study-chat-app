import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modules - Study Chat",
  description: "Manage your modules",
};

export default function ModuleDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-screen w-full flex-col">{children}</div>;
}
