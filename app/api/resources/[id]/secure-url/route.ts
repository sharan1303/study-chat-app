import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getSignedUrl } from "@/lib/supabase";

// GET /api/resources/[id]/secure-url - Get a secure signed URL for a resource
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { userId } = await auth();

  // This endpoint requires authentication - no anonymous access
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const resourceId = params.id;

  try {
    // Fetch the resource with ownership check
    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        module: {
          userId,
        },
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 }
      );
    }

    // If no file URL exists, return an error
    if (!resource.fileUrl) {
      return NextResponse.json(
        { error: "No file URL associated with this resource" },
        { status: 404 }
      );
    }

    // Check if URL matches Supabase storage path pattern
    const fileUrl = new URL(resource.fileUrl);
    const pathname = fileUrl.pathname;
    const pathMatch = pathname.match(
      /\/storage\/v1\/object\/public\/resources\/(.*)/
    );

    if (!pathMatch || !pathMatch[1]) {
      // If not a Supabase storage URL, just return the original URL
      return NextResponse.json({
        signedUrl: resource.fileUrl,
        isOriginalUrl: true,
      });
    }

    // Generate a signed URL with short expiry (5 minutes)
    const storagePath = pathMatch[1];
    const signedUrlData = await getSignedUrl("resources", storagePath, 300); // 5 minutes

    if (!signedUrlData?.signedUrl) {
      throw new Error("Failed to generate signed URL");
    }

    return NextResponse.json({
      signedUrl: signedUrlData.signedUrl,
      expiresAt: new Date(Date.now() + 300 * 1000).toISOString(), // 5 minutes from now
      isOriginalUrl: false,
    });
  } catch (error) {
    console.error("Error generating secure URL:", error);
    return NextResponse.json(
      { error: "Failed to generate secure URL" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
