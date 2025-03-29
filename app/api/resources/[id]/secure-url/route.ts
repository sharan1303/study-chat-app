import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getSignedUrl } from "@/lib/supabase";

/**
 * Retrieves a secure signed URL for a specified resource.
 *
 * This GET endpoint ensures that the request is authenticated and verifies that the
 * authenticated user owns the resource. It then checks for an associated file URL and,
 * if the URL follows the Supabase storage path pattern, generates a signed URL with a 5-minute
 * expiry. If the file URL does not match the expected pattern, the original URL is returned.
 *
 * The JSON response includes:
 * - `signedUrl`: The signed URL if generated, or the original file URL.
 * - `expiresAt`: An ISO timestamp indicating when the signed URL expires (if applicable).
 * - `isOriginalUrl`: A flag indicating whether the returned URL is the original file URL.
 *
 * HTTP responses:
 * - 401: Returned if the request is unauthenticated.
 * - 404: Returned if the resource is not found, access is denied, or no file URL is associated.
 * - 500: Returned if there is an error generating the signed URL.
 *
 * @example
 * const response = await GET(request, { params: Promise.resolve({ id: "resource123" }) });
 * // JSON response: { signedUrl: "...", expiresAt: "2025-03-25T...", isOriginalUrl: false }
 *
 * @param request - The incoming HTTP request.
 * @param props - An object containing route parameters, including the resource ID.
 */
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

    // Check if URL matches Supabase storage path pattern (handle both public and sign paths)
    const fileUrl = new URL(resource.fileUrl);
    const pathname = fileUrl.pathname;

    // Match either /public/ or /sign/ in the Supabase URL
    const pathMatch = pathname.match(
      /\/storage\/v1\/object\/(public|sign)\/resources\/(.*)/
    );

    if (!pathMatch || !pathMatch[2]) {
      // If not a Supabase storage URL, just return the original URL
      return NextResponse.json({
        signedUrl: resource.fileUrl,
        isOriginalUrl: true,
      });
    }

    // Generate a signed URL with short expiry (5 minutes)
    const storagePath = pathMatch[2];
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
