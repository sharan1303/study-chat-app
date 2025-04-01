// lib/modules.ts

import prisma from "./prisma";

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
