import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// DELETE - Remove all modules
export async function DELETE() {
  try {
    const { userId } = await auth();

    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Delete all modules belonging to the user
    const deleteResult = await prisma.module.deleteMany({
      where: { userId },
    });

    console.log(`Deleted ${deleteResult.count} modules for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: "All modules deleted successfully",
      count: deleteResult.count,
    });
  } catch (error) {
    console.error("Error deleting modules:", error);
    return NextResponse.json(
      { error: "Failed to delete modules" },
      { status: 500 }
    );
  }
}

// Add this export to tell Next.js that this route should be treated as dynamic
export const dynamic = "force-dynamic";
