import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { processResource } from "@/lib/document-processor";

/**
 * Process a resource for RAG by extracting text, creating chunks, and generating embeddings
 *
 * @param request The HTTP request containing resourceId to process
 * @returns Success or error response
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { resourceId } = body;

    if (!resourceId) {
      return NextResponse.json(
        { error: "Missing required resourceId" },
        { status: 400 }
      );
    }

    // Check if resource exists and user has access
    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        userId: userId,
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 }
      );
    }

    // Process the resource (extract text, chunk, generate embeddings)
    const success = await processResource(resourceId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to process resource" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      resourceId,
      message: "Resource processed successfully",
    });
  } catch (error) {
    console.error("Error processing resource:", error);
    return NextResponse.json(
      { error: "Failed to process resource" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
