import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { processAllUnprocessedResources } from "@/lib/rag/documentProcessor";

/**
 * Admin API to process all unprocessed resources
 * This will scan the database for resources without embeddings and process them
 */
export async function POST(request: NextRequest) {
  // Check admin authorization
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for admin role or API key auth
  // This is a placeholder for a more robust admin check
  const authHeader = request.headers.get("authorization");
  const isAdmin = authHeader === `Bearer ${process.env.ADMIN_API_KEY}`;

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  try {
    // Process all unprocessed resources
    const processedCount = await processAllUnprocessedResources();

    return NextResponse.json({
      success: true,
      processedCount,
      message: `Successfully processed ${processedCount} resources`,
    });
  } catch (error) {
    console.error("Error processing resources:", error);
    return NextResponse.json(
      { error: "Failed to process resources" },
      { status: 500 }
    );
  }
}
