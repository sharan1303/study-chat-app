import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import prisma from "@/lib/prisma";

/**
 * Attempts to create a signed URL with retry logic for JWT token issues.
 *
 * @param filePath - The storage file path to create a signed URL for
 * @param expirySeconds - How long the signed URL should be valid for
 * @returns Object containing either data with the signed URL or an error
 */
async function createSignedUrlWithRetry(
  filePath: string,
  expirySeconds: number
) {
  const supabase = getSupabaseAdmin();

  const signedUrlResult = await supabase.storage
    .from("resources")
    .createSignedUrl(filePath, expirySeconds);


  // If there's no error or it's not JWT-related, return the original result
  if (
    !signedUrlResult.error ||
    !(
      signedUrlResult.error.message.includes("JWT") ||
      signedUrlResult.error.message.includes("expired") ||
      signedUrlResult.error.message.includes("token")
    )
  ) {
    return signedUrlResult;
  }

  // Create a completely new client instance
  const freshSupabase = getSupabaseAdmin();

  // Try again with the fresh client
  const retryResult = await freshSupabase.storage
    .from("resources")
    .createSignedUrl(filePath, expirySeconds);

  console.log("📋 Retry result:", JSON.stringify(retryResult, null, 2));

  return retryResult;
}

/**
 * Handles a POST request to regenerate a signed URL for a resource.
 *
 * This function authenticates the user and validates the request payload to ensure a resource identifier is provided.
 * It retrieves the specified resource, verifies ownership, and confirms that the resource has an associated file URL.
 * The file path is then extracted from the URL using several patterns. A new signed URL valid for 12 hours is generated
 * via Supabase, with a retry mechanism in case of JWT-related issues. On success, the resource is updated in the database
 * with the new URL, and a JSON response containing the resource ID, new URL, and update timestamp is returned.
 * In case of errors—such as authentication failure, missing or invalid resource data, URL extraction failure, or database update issues—
 * a corresponding error response with an appropriate HTTP status is returned.
 *
 * @param request - The incoming Next.js API request containing a JSON body with the resource identifier.
 * @returns A JSON response with the updated resource details on success, or an error message with a corresponding HTTP status.
 */
export async function POST(request: NextRequest) {

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requestData = await request.json();
    const { resourceId } = requestData;

    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }

    // Get the resource and verify ownership
    const resource = await prisma.resource.findUnique({
      where: {
        id: resourceId,
        userId, // Ensure the resource belongs to the user
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 }
      );
    }

    // Make sure we have a fileUrl stored
    const originalUrl = resource.fileUrl;

    // Make sure we have a URL to work with
    if (!originalUrl) {
      return NextResponse.json(
        { error: "Resource does not have a file URL to regenerate" },
        { status: 400 }
      );
    }

    // Extract the file path from the URL
    let filePath: string | null = null;

    try {

      // Method 1: Extract from resources/ path pattern
      const match = originalUrl.match(/\/resources\/([^?]+)/);

      if (match && match[1]) {
        filePath = match[1];
      } else {
        // Method 2: Extract from object/sign/ pattern
        const objectMatch = originalUrl.match(
          /\/object\/(sign|public)\/resources\/([^?]+)/
        );

        if (objectMatch && objectMatch[2]) {
          filePath = objectMatch[2];
        } else {
          // Method 3: Check for token/resources pattern
          const tokenMatch = originalUrl.match(
            /token=[^&]+.*\/resources\/([^?&]+)/
          );

          if (tokenMatch && tokenMatch[1]) {
            filePath = tokenMatch[1];
          } else {
            // Method 4: Check for full URL path extraction
            try {
              const url = new URL(originalUrl);
              const pathParts = url.pathname.split("/");
              const resourcesIndex = pathParts.findIndex(
                (part) => part === "resources"
              );

              if (
                resourcesIndex !== -1 &&
                resourcesIndex < pathParts.length - 1
              ) {
                filePath = pathParts.slice(resourcesIndex + 1).join("/");
              }
            } catch (urlError) {
              console.error("❌ URL parsing error:", urlError);
            }
          }
        }
      }

      if (!filePath) {
        console.log("❌ All extraction methods failed");
        return NextResponse.json(
          { error: "Could not determine file path from URL" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("❌ Error extracting path:", error);
      return NextResponse.json(
        { error: "Failed to extract file path" },
        { status: 400 }
      );
    }

    // Ensure path doesn't start with a slash
    filePath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
    // Remove any query parameters or hash fragments
    filePath = filePath.split("?")[0].split("#")[0];

    // Generate a new signed URL (valid for 12 hours)
    const signedUrlResult = await createSignedUrlWithRetry(
      filePath,
      60 * 60 * 24
    );

    if (signedUrlResult.error) {
      return NextResponse.json(
        {
          error: "Failed to generate signed URL",
          details: signedUrlResult.error.message,
          path: filePath,
        },
        { status: 500 }
      );
    }

    if (!signedUrlResult.data?.signedUrl) {
      console.error("❌ No signed URL returned from Supabase");
      return NextResponse.json(
        { error: "No signed URL returned" },
        { status: 500 }
      );
    }

    // Update the resource with the new URL
    try {
      const updatedResource = await prisma.resource.update({
        where: {
          id: resourceId,
        },
        data: {
          fileUrl: signedUrlResult.data.signedUrl,
        },
      });

      return NextResponse.json({
        id: updatedResource.id,
        fileUrl: updatedResource.fileUrl,
        updatedAt: updatedResource.updatedAt.toISOString(),
      });
    } catch (dbError) {
      console.error("❌ Database update error:", dbError);
      // Still return the URL even if DB update fails
      return NextResponse.json({
        fileUrl: signedUrlResult.data.signedUrl,
        error: "URL generated but database update failed",
      });
    }
  } catch (error) {
    console.error("❌ Unhandled error in regeneration:", error);
    return NextResponse.json(
      {
        error: "Failed to regenerate URL",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
