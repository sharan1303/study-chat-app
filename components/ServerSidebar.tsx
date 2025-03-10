import { auth } from "@clerk/nextjs/server";
import Sidebar from "./Sidebar";
import prisma from "@/lib/prisma";

export default async function ServerSidebar() {
  // Get the authenticated user information on the server
  const { userId } = await auth();

  if (!userId) {
    // Pass empty modules to the client component
    return <Sidebar modules={[]} loading={false} />;
  }

  // Fetch modules from the database on the server
  try {
    const modules = await prisma.module.findMany({
      where: {
        userId,
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

    // Transform date objects to strings for client components
    const formattedModules = modules.map((module) => ({
      ...module,
      lastStudied: module.lastStudied ? module.lastStudied.toISOString() : null,
    }));

    // Pass the pre-fetched modules to the client component
    return <Sidebar modules={formattedModules} loading={false} />;
  } catch (error) {
    console.error("Error fetching modules for sidebar:", error);
    return <Sidebar modules={[]} loading={false} />;
  }
}
