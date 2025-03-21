"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export interface ModuleResource {
  id: string;
  title: string;
  type: string;
  content: string;
  fileUrl: string | null;
  moduleId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleWithResources {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  createdAt: string;
  updatedAt: string;
  lastStudied: string | null;
  resources: ModuleResource[];
}

export interface ModuleBasic {
  id: string;
  name: string;
  icon: string;
  lastStudied: string | null;
}

// Server action to fetch module details by ID
export async function getModuleDetails(
  moduleId: string | null
): Promise<ModuleWithResources | null> {
  if (!moduleId) return null;

  try {
    const { userId } = await auth();
    if (!userId) return null;

    const moduleData = await prisma.module.findUnique({
      where: {
        id: moduleId,
        userId: userId,
      },
      include: {
        resources: true,
      },
    });

    if (!moduleData) return null;

    // Update last studied timestamp
    await prisma.module.update({
      where: {
        id: moduleId,
      },
      data: {
        lastStudied: new Date(),
      },
    });

    // Serialize dates for client-side consumption
    return {
      ...moduleData,
      createdAt: moduleData.createdAt.toISOString(),
      updatedAt: moduleData.updatedAt.toISOString(),
      lastStudied: moduleData.lastStudied
        ? moduleData.lastStudied.toISOString()
        : null,
      resources: moduleData.resources.map((resource) => ({
        ...resource,
        content: resource.content || "",
        createdAt: resource.createdAt.toISOString(),
        updatedAt: resource.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error fetching module details:", error);
    return null;
  }
}

// Server action to fetch all modules
export async function getAllModules(): Promise<ModuleBasic[]> {
  try {
    const { userId } = await auth();
    if (!userId) return [];

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

// Specifically get module by name
export async function getModuleByName(
  moduleName: string | null
): Promise<ModuleWithResources | null> {
  if (!moduleName) return null;

  try {
    const { userId } = await auth();
    if (!userId) return null;

    const moduleData = await prisma.module.findFirst({
      where: {
        // Use case-insensitive search for better matching
        name: {
          mode: "insensitive",
          equals: moduleName,
        },
        userId,
      },
      include: {
        resources: true,
      },
    });

    if (!moduleData) return null;

    // Update lastStudied timestamp
    await prisma.module.update({
      where: { id: moduleData.id },
      data: { lastStudied: new Date() },
    });

    // Convert all Date objects to ISO strings for client components
    return {
      ...moduleData,
      createdAt: moduleData.createdAt.toISOString(),
      updatedAt: moduleData.updatedAt.toISOString(),
      lastStudied: moduleData.lastStudied
        ? moduleData.lastStudied.toISOString()
        : null,
      resources: moduleData.resources.map((resource) => ({
        ...resource,
        content: resource.content || "",
        createdAt: resource.createdAt.toISOString(),
        updatedAt: resource.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error fetching module by name:", error);
    return null;
  }
}

// Function to fetch resources from the database
export async function getResources(userId: string) {
  try {
    // First get user's modules
    const userModules = await prisma.module.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
      },
    });

    // Get moduleIds for the user
    const moduleIds = userModules.map((module) => module.id);

    // Then fetch resources for those modules
    const resources = await prisma.resource.findMany({
      where: {
        moduleId: { in: moduleIds },
      },
      include: {
        module: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return resources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      description: resource.content, // Map content to description
      type: resource.type,
      url: resource.fileUrl, // Map fileUrl to url
      moduleId: resource.moduleId,
      moduleName: resource.module?.name || null,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to fetch resources:", error);
    return [];
  }
}
