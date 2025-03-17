import { Suspense } from "react";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { generateId, decodeModuleSlug } from "@/lib/utils";
import prisma from "@/lib/prisma";
import ClientChatPage from "@/app/ClientChatPage";
import { ChatPageLoading } from "@/app/ClientChatPage";

export default async function NewModuleChat({
  params,
}: {
  params: { moduleName: string };
}) {
  const { userId } = await auth();
  const isAuthenticated = !!userId;

  // Get the module name from the URL path
  const decodedModuleName = decodeModuleSlug(params.moduleName);

  // Generate a new chat ID
  const chatId = generateId();

  // For unauthenticated users, we'll show a basic chat interface without module context
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<ChatPageLoading />}>
        <ClientChatPage
          initialModuleDetails={null}
          chatId={chatId}
          initialMessages={[]}
          isAuthenticated={false}
        />
      </Suspense>
    );
  }

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

    // Convert Date objects to strings for compatibility with the component
    const moduleWithStringDates = {
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
        <ClientChatPage
          initialModuleDetails={moduleWithStringDates}
          chatId={chatId}
          initialMessages={[]}
          isAuthenticated={true}
        />
      </Suspense>
    );
  } catch (error) {
    console.error("Error loading module:", error);
    return notFound();
  }
}

// Add this export to allow dynamic rendering
export const dynamic = "force-dynamic";
