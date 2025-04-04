import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin, uploadFile } from "@/lib/supabase";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

// Configure Next.js to handle larger uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Processes a file upload request.
 *
 * This API endpoint verifies that the user is authenticated, then extracts a file and its associated metadata (title, moduleId, type)
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

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    // Extract form fields
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const moduleId = formData.get("moduleId") as string;
    const type = formData.get("type") as string;

    // Validate required fields
    if (!file || !title || !moduleId || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if the module exists and belongs to the user
    const moduleRecord = await prisma.module.findUnique({
      where: {
        id: moduleId,
        userId,
      },
    });

    if (!moduleRecord) {
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
      .createSignedUrl(filePath, 60 * 60 * 24); // 24 hours for initial URL

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

    // Create the resource record in the database
    const resource = await prisma.resource.create({
      data: {
        title,
        type: fileType,
        fileUrl: normalizedFileUrl,
        moduleId,
        userId,
        fileSize: file.size,
      },
    });

    return NextResponse.json({
      id: resource.id,
      title: resource.title,
      type: resource.type,
      url: resource.fileUrl,
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
