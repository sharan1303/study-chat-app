import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name");

  if (!userId) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    // If a name parameter is provided, filter modules by name
    if (name) {
      // First try exact match (case-insensitive)
      const moduleByExactName = await prisma.module.findFirst({
        where: {
          userId,
          name: {
            mode: "insensitive",
            equals: name,
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
          lastStudied: true,
          createdAt: true,
          updatedAt: true,
          resources: {
            select: {
              id: true,
            },
          },
        },
      });

      if (moduleByExactName) {
        // Return the exact match with the new response format
        const formattedModule = {
          id: moduleByExactName.id,
          name: moduleByExactName.name,
          description: moduleByExactName.description,
          icon: moduleByExactName.icon,
          lastStudied: moduleByExactName.lastStudied
            ? moduleByExactName.lastStudied.toISOString()
            : null,
          createdAt: moduleByExactName.createdAt.toISOString(),
          updatedAt: moduleByExactName.updatedAt.toISOString(),
          resourceCount: moduleByExactName.resources.length,
        };

        return NextResponse.json({ modules: [formattedModule] });
      }

      // If no exact match, try fuzzy matching
      // Get all modules to try fuzzy matching on the server side
      const allModules = await prisma.module.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
          lastStudied: true,
          createdAt: true,
          updatedAt: true,
          resources: {
            select: {
              id: true,
            },
          },
        },
      });

      // Find modules that match when normalized
      const matchingModules = allModules.filter((module) => {
        const normalizedDbName = module.name
          .toLowerCase()
          .replace(/[^\w\s]/g, "");
        const normalizedSearchName = name.toLowerCase().replace(/[^\w\s]/g, "");
        return (
          normalizedDbName.includes(normalizedSearchName) ||
          normalizedSearchName.includes(normalizedDbName)
        );
      });

      if (matchingModules.length > 0) {
        // Format modules and return them
        const formattedModules = matchingModules.map((module) => ({
          id: module.id,
          name: module.name,
          description: module.description,
          icon: module.icon,
          lastStudied: module.lastStudied
            ? module.lastStudied.toISOString()
            : null,
          createdAt: module.createdAt.toISOString(),
          updatedAt: module.updatedAt.toISOString(),
          resourceCount: module.resources.length,
        }));

        return NextResponse.json({ modules: formattedModules });
      }

      // If no match found, return empty array
      return NextResponse.json({ modules: [] });
    }

    // Default behavior - fetch all modules
    const modules = await prisma.module.findMany({
      where: {
        userId,
      },
      orderBy: {
        lastStudied: "desc",
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

    return NextResponse.json({ modules: formattedModules });
  } catch (error) {
    console.error("Error fetching modules:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/modules - Starting module creation");
    const { userId } = await auth();
    console.log("User ID from auth:", userId);

    if (!userId) {
      console.log("Unauthorized - No user ID found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Request body:", body);
    const { name, description, icon } = body;

    if (!name) {
      console.log("Bad request - Name is required");
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if user exists in the database
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // If user doesn't exist, create a new user
    if (!user) {
      console.log("User not found in database, creating new user");
      try {
        // Get user email from Clerk (in a real app)
        // For now, use a placeholder
        const email = `user-${userId}@example.com`;

        user = await prisma.user.create({
          data: {
            id: userId,
            email: email,
            name: `User ${userId.substring(0, 8)}`,
          },
        });
        console.log("New user created:", user);
      } catch (userError) {
        console.error("Error creating user:", userError);
        if (userError instanceof Prisma.PrismaClientKnownRequestError) {
          if (userError.code === "P2002") {
            // If the error is a unique constraint violation, try to fetch the user again
            user = await prisma.user.findUnique({
              where: { id: userId },
            });

            if (!user) {
              return NextResponse.json(
                { error: "Failed to create user - Email already exists" },
                { status: 500 }
              );
            }
          } else {
            return NextResponse.json(
              { error: "Failed to create user" },
              { status: 500 }
            );
          }
        } else {
          return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
          );
        }
      }
    }

    console.log("Creating module with data:", {
      name,
      description,
      icon,
      userId,
    });
    const newModule = await prisma.module.create({
      data: {
        name,
        description,
        icon,
        userId,
      } as Prisma.ModuleUncheckedCreateInput,
    });

    console.log("Module created successfully:", newModule);
    return NextResponse.json(newModule, { status: 201 });
  } catch (error) {
    console.error("Error creating module:", error);

    // More detailed error logging
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma error code:", error.code);
      console.error("Prisma error message:", error.message);

      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "A module with this name already exists" },
          { status: 409 }
        );
      } else if (error.code === "P2003") {
        return NextResponse.json(
          { error: "User not found. Please sign out and sign in again." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create module", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Add this export to tell Next.js that this route should be treated as dynamic
export const dynamic = "force-dynamic";
