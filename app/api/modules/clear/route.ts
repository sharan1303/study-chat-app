import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

/**
 * Handles HTTP DELETE requests to remove all modules associated with the authenticated user.
 *
 * The function authenticates the user and checks for the presence of a confirmation query parameter
 * ("?confirmed=true"). If the user is not authenticated, it returns a 401 error. If the confirmation is
 * not provided, it returns a 400 error. When both conditions are met, it deletes all modules tied to the user,
 * logs the deletion event using both a simple and structured JSON format, and returns a success response with
 * the count of deleted modules. In case of an unexpected error during deletion, it returns a 500 error.
 *
 * @param request - The incoming HTTP request containing the URL with potential query parameters.
 *
 * @returns A JSON response indicating success with the count of deleted modules or an error message on failure.
 */
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const confirmed = searchParams.get("confirmed") === "true";

    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Require confirmation for bulk deletion
    if (!confirmed) {
      return NextResponse.json(
        { error: "Confirmation required to delete all modules. Add ?confirmed=true to confirm." },
        { status: 400 }
      );
    }

    // Delete all modules belonging to the user
    const deleteResult = await prisma.module.deleteMany({
      where: { userId },
    });

    console.log(`Deleted ${deleteResult.count} modules for user ${userId}`);
    
    // Use structured logging for better production debugging
    console.log(
      JSON.stringify({
        event: "modules_deleted",
        userId,
        count: deleteResult.count,
        timestamp: new Date().toISOString(),
      })
    );

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
