import ClientChatPage from "../ClientChatPage";
import { Suspense } from "react";
import { ChatPageLoading } from "../ClientChatPage";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// Server Component for dynamic module routes
export default async function ModulePage({
  params,
}: {
  params: { moduleName: string };
}) {
  const { userId } = await auth();

  if (!userId) {
    notFound();
  }

  // Get the module name from the URL path
  const decodedModuleName = decodeURIComponent(params.moduleName)
    .replace(/-/g, " ") // Convert hyphens back to spaces
    .split(" ") // Split into words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Title case each word
    .join(" "); // Join back into a string

  // Find the module directly using Prisma
  const moduleData = await prisma.module.findFirst({
    where: {
      userId,
      name: {
        mode: "insensitive",
        equals: decodedModuleName,
      },
    },
    include: {
      resources: true,
    },
  });

  // If module not found, return 404
  if (!moduleData) {
    notFound();
  }

  // Update lastStudied timestamp
  await prisma.module.update({
    where: { id: moduleData.id },
    data: { lastStudied: new Date() },
  });

  // Convert Date objects to ISO strings for client components
  const moduleDetails = {
    ...moduleData,
    createdAt: moduleData.createdAt.toISOString(),
    updatedAt: moduleData.updatedAt.toISOString(),
    lastStudied: moduleData.lastStudied
      ? moduleData.lastStudied.toISOString()
      : null,
    resources: moduleData.resources.map((resource) => ({
      ...resource,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
    })),
  };

  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ClientChatPage initialModuleDetails={moduleDetails} />
    </Suspense>
  );
}
