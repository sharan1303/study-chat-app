"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export interface ModuleResource {
  id: string;
  title: string;
  type: string;
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

/**
 * Retrieves detailed information for a specific module along with its associated resources.
 *
 * This function fetches the module data for the authenticated user using the provided module ID. If found, it updates the module's
 * last studied timestamp and returns the module details with all date fields serialized to ISO strings. If the module ID is null,
 * the user is not authenticated, or the module does not exist, the function returns null.
 *
 * @param moduleId - Unique identifier for the module or null if not provided.
 * @returns A Promise that resolves to the module details with its resources, or null if the module cannot be found.
 */
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

/**
 * Fetches a module by its name for the authenticated user.
 *
 * Performs a case-insensitive search to locate a module by the given name and retrieves its associated resources.
 * If a module is found, its "lastStudied" timestamp is updated and all date fields are serialized to ISO strings.
 * Returns null if the module name is null, the user is not authenticated, or no matching module is found.
 *
 * @param moduleName - The name of the module to retrieve.
 * @returns The module details with associated resources, or null if not found or unauthenticated.
 */
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
        createdAt: resource.createdAt.toISOString(),
        updatedAt: resource.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error fetching module by name:", error);
    return null;
  }
}

/**
 * Retrieves resources associated with modules belonging to a specific user.
 *
 * This function first fetches all modules owned by the given user and extracts their IDs. It then
 * retrieves resources linked to those modules, including the module's name, orders them by creation
 * date in descending order, and maps the results to a simplified format with ISO-formatted date strings.
 * In case of an error during retrieval or mapping, it logs the error and returns an empty array.
 *
 * @param userId - The identifier of the user whose module resources are being fetched.
 * @returns A promise that resolves to an array of resource objects containing properties: id, title, type, url,
 *          moduleId, moduleName, createdAt, and updatedAt.
 */
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
