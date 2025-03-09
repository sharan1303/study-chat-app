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
  const decodedModuleName = decodeURIComponent(params.moduleName).replace(
    /-/g,
    " "
  ); // Convert hyphens back to spaces

  try {
    // First try to find the module by exact match (case insensitive)
    let moduleData = await prisma.module.findFirst({
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

    // If not found, try a more flexible search approach
    if (!moduleData) {
      // Get all modules for this user
      const allModules = await prisma.module.findMany({
        where: { userId },
        include: { resources: true },
      });

      // Find modules with names that might match our URL when encoded
      // This handles cases where punctuation differences exist
      const matchingModule = allModules.find((module) => {
        // Normalize both strings by lowercasing and removing special chars
        const normalizedDbName = module.name
          .toLowerCase()
          .replace(/[^\w\s]/g, "");
        const normalizedSearchName = decodedModuleName
          .toLowerCase()
          .replace(/[^\w\s]/g, "");
        return normalizedDbName === normalizedSearchName;
      });

      if (matchingModule) {
        moduleData = matchingModule;
      } else {
        return notFound();
      }
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
  } catch (error) {
    console.error("Error loading module:", error);
    return notFound();
  }
}

// Add this export to allow dynamic rendering
export const dynamic = "force-dynamic";
