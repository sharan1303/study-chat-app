import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin, uploadFile } from "@/lib/supabase";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { broadcastResourceCreated } from "@/lib/events";
import { Prisma } from "@prisma/client";
import { handleResourceUploaded } from "@/lib/rag/webhooks";

// Configure Next.js to handle larger uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Processes a file upload request.
 *
 * This API endpoint verifies that the user is authenticated, then extracts a file and its associated metadata (title, moduleId)
 * from the submitted form data. It ensures that all required fields are present, checks that the referenced module exists and is owned by the user,
 * and validates that the file does not exceed a 50MB size limit.
 *
 * Upon successful validation, the file is assigned a unique filename and uploaded to Supabase storage. A signed URL valid for 24 hours is generated
 * (and normalized to use the correct path), and a new resource record is created in the database. The endpoint responds with a JSON object containing
 * the resource's details.
 *
 * In cases of authentication failure, missing fields, module access issues, file size violations, or problems during file upload or URL generation,
 * the function returns a JSON error response with the appropriate HTTP status code.
 *
 * @param request - The incoming HTTP request containing form data with the file and its metadata.
 * @returns A JSON response with resource details on success or an error message with an appropriate HTTP status code on failure.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("sessionId");

  // Authentication required for resource uploads
  if (!userId) {
    console.error("No userId provided for resource upload");
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();

    // Extract form fields
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const moduleId = formData.get("moduleId") as string;

    // Validate required fields
    if (!file || !title || !moduleId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Build the query condition based on user ID or sessionId
    const whereCondition: Prisma.ModuleWhereInput = {
      id: moduleId,
    };

    // We only allow fetching module on session id if it is linked to a userid
    // to only allow for authenticated user
    if (sessionId) {
      whereCondition.OR = [{ userId }, { sessionId }];
    } else {
      whereCondition.userId = userId;
    }

    // Check if the module exists and belongs to the user
    const moduleRecord = await prisma.module.findFirst({
      where: whereCondition,
    });

    if (!moduleRecord) {
      console.error("Module not found or access denied:", {
        moduleId,
        userId,
        sessionId: sessionId ? `${sessionId.substring(0, 8)}...` : null,
        whereCondition,
      });
      return NextResponse.json(
        { error: "Module not found or access denied" },
        { status: 404 }
      );
    }

    // Extract file info
    const fileName = file.name;
    const fileType = file.type;
    const fileSize = file.size;

    // Validate file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds limit (50MB)" },
        { status: 400 }
      );
    }

    // Create a unique filename to prevent collisions
    const fileExt = fileName.split(".").pop();
    const uniqueFileName = `${uuidv4()}.${fileExt}`;

    // Define the path in Supabase storage (resources/userId/moduleId/filename)
    const filePath = `${userId}/${moduleId}/${uniqueFileName}`;

    // Upload the file to Supabase
    const uploadResult = await uploadFile("resources", filePath, file, userId, {
      contentType: fileType,
    });

    if (!uploadResult) {
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get a fresh client for the signed URL
    const supabase = getSupabaseAdmin();

    // Get the signed URL - make sure to use the 'sign' path format
    const { data: signedUrlData, error: signUrlError } = await supabase.storage
      .from("resources")
      .createSignedUrl(filePath, 60 * 60 * 24);

    if (signUrlError) {
      console.error("Error creating signed URL:", signUrlError);
      return NextResponse.json(
        { error: "Failed to create signed URL" },
        { status: 500 }
      );
    }

    const fileUrl = signedUrlData?.signedUrl || "";

    // Ensure the stored URL uses the /sign/ path format, not /public/
    let normalizedFileUrl = fileUrl;
    if (normalizedFileUrl.includes("/object/public/")) {
      normalizedFileUrl = normalizedFileUrl.replace(
        "/object/public/",
        "/object/sign/"
      );
    }

    // Create data object for resource with appropriate IDs
    const resourceData: Prisma.ResourceCreateInput = {
      title,
      type: fileType,
      fileUrl: normalizedFileUrl,
      module: { connect: { id: moduleId } },
      fileSize: file.size,
      user: { connect: { id: userId } },
    };

    // Create the resource record in the database
    const resource = await prisma.resource.create({
      data: resourceData,
    });

    // Broadcast the resource created event
    broadcastResourceCreated({
      id: resource.id,
      moduleId: resource.moduleId,
    });

    // Process the document asynchronously
    // We don't await this to keep the upload response fast
    // The document will be processed in the background
    handleResourceUploaded(resource.id).catch((error) => {
      console.error(`Error processing resource ${resource.id}:`, error);
    });

    return NextResponse.json({
      id: resource.id,
      title: resource.title,
      type: resource.type,
      fileUrl: resource.fileUrl,
      fileSize: resource.fileSize,
      moduleId: resource.moduleId,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
