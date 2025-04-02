// lib/modules.ts

import prisma from "./prisma";

/**
 * Retrieves a module's context information as a formatted string.
 *
 * This asynchronous function fetches a module by its unique identifier from the database, including its associated resources. If found, it returns a string that includes the module's name, an optional description, and a list of resources formatted with each resource's title and type separated by two newlines. If no module is found, it returns "No module information available."
 *
 * @param moduleId - The unique identifier of the module.
 * @returns A formatted string representing the module's details or a message indicating the absence of module data.
 */
export async function getModuleContext(moduleId: string): Promise<string> {
  const modules = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { resources: true },
  });

  if (!modules) {
    return "No module information available.";
  }

  const resourcesContext = modules.resources
    .map((resource) => `${resource.title} ${resource.type}`)
    .join("\n\n");

  return `
    Module: ${modules.name}
    Description: ${modules.description || ""}
    
    Resources:
    ${resourcesContext}
  `;
}

export async function getAllModules(userId: string) {
  return prisma.module.findMany({
    where: { userId },
    include: { resources: true },
  });
}

export async function getModuleById(moduleId: string) {
  return prisma.module.findUnique({
    where: { id: moduleId },
    include: { resources: true },
  });
}

export async function addResourceToModule(
  moduleId: string,
  resource: { title: string; type: string; content: string; fileUrl?: string }
) {
  return prisma.resource.create({
    data: {
      ...resource,
      module: { connect: { id: moduleId } },
    },
  });
}
