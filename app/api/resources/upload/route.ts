import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin, uploadFile } from "@/lib/supabase";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

// Configure Next.js to handle larger uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

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
    const description = (formData.get("description") as string) || "";

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

    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds limit (10MB)" },
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

    // Get the public URL
    const { data: publicUrlData } = await supabaseAdmin.storage
      .from("resources")
      .getPublicUrl(filePath);

    const fileUrl = publicUrlData.publicUrl;

    // Create the resource record in the database
    const resource = await prisma.resource.create({
      data: {
        title,
        content: description || "",
        type,
        fileUrl,
        moduleId,
        userId,
        // You might want to store additional metadata
        // fileSize, mimeType, etc.
      },
    });

    return NextResponse.json({
      id: resource.id,
      title: resource.title,
      description: resource.content,
      type: resource.type,
      url: resource.fileUrl,
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
