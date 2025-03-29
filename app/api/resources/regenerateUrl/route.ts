import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import prisma from "@/lib/prisma";

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
  console.log("🔄 URL REGENERATION - Request received");

  const { userId } = await auth();

  if (!userId) {
    console.log("❌ Authentication failed - No user ID");
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
    console.log(`🔍 Finding resource - ID: ${resourceId}, User ID: ${userId}`);
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

    console.log("🔍 Original URL:", originalUrl);

    // Extract the file path from the URL
    let filePath: string | null = null;

    try {
      // Try multiple methods to extract the file path
      console.log("🔍 Attempting to extract file path from URL");

      // Method 1: Extract from resources/ path pattern
      const match = originalUrl.match(/\/resources\/([^?]+)/);
      console.log("📋 Method 1 match result:", match);

      if (match && match[1]) {
        filePath = match[1];
      } else {
        // Method 2: Extract from object/sign/ pattern
        const objectMatch = originalUrl.match(
          /\/object\/(sign|public)\/resources\/([^?]+)/
        );
        console.log("📋 Method 2 match result:", objectMatch);

        if (objectMatch && objectMatch[2]) {
          filePath = objectMatch[2];
        } else {
          // Method 3: Check for token/resources pattern
          const tokenMatch = originalUrl.match(
            /token=[^&]+.*\/resources\/([^?&]+)/
          );
          console.log("📋 Method 3 match result:", tokenMatch);

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
              } else {
                console.log("❌ Method 4 failed to extract path");
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
    console.log("🔄 Final file path for signed URL:", filePath);

    // Get a fresh Supabase client for each request
    console.log("🔄 Initializing Supabase client");
    const supabase = getSupabaseAdmin();

    // Generate a new signed URL (valid for 12 hours)
    console.log("🔄 Generating signed URL for path:", filePath);
    const signedUrlResult = await supabase.storage
      .from("resources")
      .createSignedUrl(filePath, 60 * 60 * 24); // 12 hours

    console.log(
      "📋 Signed URL result:",
      JSON.stringify(signedUrlResult, null, 2)
    );

    if (signedUrlResult.error) {
      console.error("❌ Supabase signed URL error:", signedUrlResult.error);

      // Special handling for JWT expiration errors
      if (
        signedUrlResult.error.message.includes("JWT") ||
        signedUrlResult.error.message.includes("expired") ||
        signedUrlResult.error.message.includes("token")
      ) {
        console.log(
          "🔑 JWT token issue detected. Trying with refreshed client"
        );

        // Create a completely new client instance
        const freshSupabase = getSupabaseAdmin();

        // Try again with the fresh client
        const retryResult = await freshSupabase.storage
          .from("resources")
          .createSignedUrl(filePath, 60 * 60 * 24); // 12 hours

        console.log("📋 Retry result:", JSON.stringify(retryResult, null, 2));

        if (retryResult.error) {
          console.error("❌ Retry also failed:", retryResult.error);
          return NextResponse.json(
            {
              error: "Failed to generate signed URL even after JWT refresh",
              details: retryResult.error.message,
              path: filePath,
            },
            { status: 500 }
          );
        }

        // Use the retry result if successful
        if (retryResult.data?.signedUrl) {
          console.log("✅ Retry successful, got new signed URL");
          // Create a new result object instead of modifying the existing one
          const successResult = {
            data: retryResult.data,
            error: null,
          };

          // Continue with the successful result
          console.log("✅ Successfully generated new signed URL");

          // Update the resource with the new URL
          try {
            console.log("🔄 Updating resource in database with new URL");
            const updatedResource = await prisma.resource.update({
              where: {
                id: resourceId,
              },
              data: {
                fileUrl: successResult.data.signedUrl,
              },
            });

            console.log("✅ Database update successful");

            return NextResponse.json({
              id: updatedResource.id,
              url: updatedResource.fileUrl,
              updatedAt: updatedResource.updatedAt.toISOString(),
            });
          } catch (dbError) {
            console.error("❌ Database update error:", dbError);
            // Still return the URL even if DB update fails
            return NextResponse.json({
              url: successResult.data.signedUrl,
              error: "URL generated but database update failed",
            });
          }
        }
      } else {
        // For other errors, return the error
        return NextResponse.json(
          {
            error: "Failed to generate signed URL",
            details: signedUrlResult.error.message,
            path: filePath,
          },
          { status: 500 }
        );
      }
    }

    if (!signedUrlResult.data?.signedUrl) {
      console.error("❌ No signed URL returned from Supabase");
      return NextResponse.json(
        { error: "No signed URL returned" },
        { status: 500 }
      );
    }

    console.log("✅ Successfully generated new signed URL");

    // Update the resource with the new URL
    try {
      console.log("🔄 Updating resource in database with new URL");
      const updatedResource = await prisma.resource.update({
        where: {
          id: resourceId,
        },
        data: {
          fileUrl: signedUrlResult.data.signedUrl,
        },
      });

      console.log("✅ Database update successful");

      return NextResponse.json({
        id: updatedResource.id,
        url: updatedResource.fileUrl,
        updatedAt: updatedResource.updatedAt.toISOString(),
      });
    } catch (dbError) {
      console.error("❌ Database update error:", dbError);
      // Still return the URL even if DB update fails
      return NextResponse.json({
        url: signedUrlResult.data.signedUrl,
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
