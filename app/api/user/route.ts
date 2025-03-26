import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();

    return NextResponse.json({
      userId: userId || null,
      isAuthenticated: !!userId,
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    return NextResponse.json(
      {
        error: "Failed to get user information",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Tell Next.js this is a dynamic API route that shouldn't be cached
export const dynamic = "force-dynamic";
